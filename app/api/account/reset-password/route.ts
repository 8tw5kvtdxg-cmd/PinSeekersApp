import { cookies } from "next/headers";
import { getPasswordResetToken } from "@/lib/account-recovery";
import { getPrismaClient } from "@/lib/prisma";
import {
  createPlayerSessionValue,
  hashPassword,
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
    token?: unknown;
    password?: unknown;
  };
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token || password.length < 8) {
    return Response.json(
      { error: "Reset token and an 8+ character password are required." },
      { status: 400 },
    );
  }

  const resetToken = await getPasswordResetToken(token);

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt < new Date()
  ) {
    return Response.json(
      { error: "Reset link is invalid or expired." },
      { status: 400 },
    );
  }

  const user = await prisma.$transaction(async (transaction) => {
    const updatedUser = await transaction.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: hashPassword(password) },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
      },
    });

    await transaction.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    await transaction.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
        id: { not: resetToken.id },
      },
      data: { usedAt: new Date() },
    });

    return updatedUser;
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

  return Response.json({ user: publicPlayer(user) });
}
