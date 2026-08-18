import { cookies } from "next/headers";
import {
  createEmailVerificationToken,
  sendEmailVerification,
  validateEmailForSignup,
} from "@/lib/email-verification";
import { getPrismaClient } from "@/lib/prisma";
import {
  createPlayerSessionValue,
  hashPassword,
  normalizeEmail,
  normalizeUsername,
  playerSessionCookieName,
  publicPlayer,
} from "@/lib/player-auth";

export const dynamic = "force-dynamic";

function isPrismaUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as {
    username?: unknown;
    email?: unknown;
    password?: unknown;
  };
  const username =
    typeof body.username === "string" ? normalizeUsername(body.username) : "";
  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !email || password.length < 8) {
    return Response.json(
      { error: "Username, email, and an 8+ character password are required." },
      { status: 400 },
    );
  }

  try {
    const emailValidationError = await validateEmailForSignup(email);

    if (emailValidationError) {
      return Response.json({ error: emailValidationError }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: {
        email: true,
        username: true,
      },
    });

    if (existingUser) {
      const isEmailMatch = existingUser.email === email;

      return Response.json(
        {
          error: isEmailMatch
            ? "An account with that email already exists."
            : "That username is already taken.",
        },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name: username,
        username,
        email,
        passwordHash: hashPassword(password),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
      },
    });
    const token = await createEmailVerificationToken({
      userId: user.id,
      email: user.email,
    });
    let verificationSent = true;
    let verificationWarning = "";

    try {
      await sendEmailVerification({
        email: user.email,
        username: user.username,
        token,
        request,
      });
    } catch (emailError) {
      console.error("Could not send signup verification email.", emailError);
      verificationSent = false;
      verificationWarning =
        "Account created, but the verification email could not be sent. Use resend verification from your account page.";
    }

    const cookieStore = await cookies();

    cookieStore.set({
      name: playerSessionCookieName,
      value: createPlayerSessionValue(user.id),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return Response.json(
      {
        user: publicPlayer(user),
        verificationSent,
        warning: verificationWarning || undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Could not create account.", error);

    return Response.json(
      {
        error: isPrismaUniqueConstraintError(error)
          ? "An account with that email or username already exists."
          : "Could not create account.",
      },
      { status: 400 },
    );
  }
}
