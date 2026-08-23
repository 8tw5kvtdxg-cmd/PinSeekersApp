import { cookies } from "next/headers";
import { adminSessionCookieName } from "@/lib/admin-auth";
import { validateEmailForSignup } from "@/lib/email-verification";
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

function usernameSeedFrom(value: string) {
  const seed = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return seed || `player-${Date.now()}`;
}

async function resolveAvailableUsername(input: {
  prisma: NonNullable<ReturnType<typeof getPrismaClient>>;
  requestedUsername: string;
  email: string;
  simulatorDisplayName: string;
}) {
  if (input.requestedUsername) {
    const existingUsername = await input.prisma.user.findUnique({
      where: { username: input.requestedUsername },
      select: { id: true },
    });

    if (existingUsername) {
      throw new Error("That username is already taken.");
    }

    return input.requestedUsername;
  }

  const emailLocalPart = input.email.split("@")[0] ?? "";
  const baseUsername = usernameSeedFrom(
    input.simulatorDisplayName || emailLocalPart,
  ).slice(0, 40);

  for (let index = 0; index < 50; index += 1) {
    const username =
      index === 0 ? baseUsername : `${baseUsername}-${index + 1}`;
    const existingUsername = await input.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existingUsername) {
      return username;
    }
  }

  return `${baseUsername}-${Date.now()}`;
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
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    simulatorDisplayName?: unknown;
    password?: unknown;
  };
  const requestedUsername =
    typeof body.username === "string" ? normalizeUsername(body.username) : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const simulatorDisplayName =
    typeof body.simulatorDisplayName === "string"
      ? body.simulatorDisplayName.trim()
      : requestedUsername;
  const password = typeof body.password === "string" ? body.password : "";

  if (
    !name ||
    !email ||
    !phone ||
    !simulatorDisplayName ||
    password.length < 8
  ) {
    return Response.json(
      {
        error:
          "Name, phone, E6 Golf username, email, and an 8+ character password are required.",
      },
      { status: 400 },
    );
  }

  try {
    const emailValidationError = await validateEmailForSignup(email);

    if (emailValidationError) {
      return Response.json({ error: emailValidationError }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
      },
    });

    if (existingEmail) {
      return Response.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const username = await resolveAvailableUsername({
      email,
      prisma,
      requestedUsername,
      simulatorDisplayName,
    });

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        phone,
        simulatorDisplayName,
        emailVerifiedAt: new Date(),
        passwordHash: hashPassword(password),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        simulatorDisplayName: true,
        emailVerifiedAt: true,
      },
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

    cookieStore.set({
      name: adminSessionCookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return Response.json(
      {
        user: publicPlayer(user),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Could not create account.", error);

    return Response.json(
      {
        error:
          error instanceof Error && error.message === "That username is already taken."
            ? error.message
            : isPrismaUniqueConstraintError(error)
          ? "An account with that email or username already exists."
          : "Could not create account.",
      },
      { status: 400 },
    );
  }
}
