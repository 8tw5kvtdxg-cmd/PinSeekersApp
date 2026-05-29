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

    await sendEmailVerification({
      email: user.email,
      username: user.username,
      token,
      request,
    });

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
      { user: publicPlayer(user), verificationSent: true },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error && error.message.includes("Unique constraint")
            ? "An account with that email or username already exists."
            : "Could not create account.",
      },
      { status: 400 },
    );
  }
}
