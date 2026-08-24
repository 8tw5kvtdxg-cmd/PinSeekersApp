import { cookies } from "next/headers";
import {
  adminSessionCookieName,
  createAdminSessionValue,
  isAdminEmail,
} from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  createPlayerSessionValue,
  normalizeEmail,
  playerSessionCookieName,
  publicPlayer,
  verifyPassword,
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
    login?: unknown;
    password?: unknown;
  };
  const login = typeof body.login === "string" ? body.login.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!login || !password) {
    return Response.json(
      { error: "Email/username and password are required." },
      { status: 400 },
    );
  }

  const normalizedEmail = normalizeEmail(login);
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { username: login }],
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      simulatorDisplayName: true,
      emailVerifiedAt: true,
      passwordHash: true,
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json(
      { error: "Invalid email/username or password." },
      { status: 401 },
    );
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

  cookieStore.set({
    name: adminSessionCookieName,
    value: isAdminEmail(user.email) ? createAdminSessionValue(user.email) : "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: isAdminEmail(user.email) ? 60 * 60 * 8 : 0,
  });

  return Response.json({ user: publicPlayer(user) });
}
