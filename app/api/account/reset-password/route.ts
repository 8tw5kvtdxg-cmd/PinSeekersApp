import { cookies } from "next/headers";
import { deleteAdminSessionsForUser } from "@/lib/admin-auth";
import { getPasswordResetToken } from "@/lib/account-recovery";
import { getPrismaClient } from "@/lib/prisma";
import {
  createPlayerSession,
  deletePlayerSessionsForUser,
  hashPassword,
  playerSessionDurationSeconds,
  playerSessionCookieName,
  publicPlayer,
} from "@/lib/player-auth";
import { consumeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const rateLimit = await consumeRateLimit({
    namespace: "password-reset",
    identifier: getClientIp(request),
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

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
        simulatorDisplayName: true,
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
  await deleteAdminSessionsForUser(user.id);
  await deletePlayerSessionsForUser(user.id);
  const playerSessionToken = await createPlayerSession(user.id);

  cookieStore.set({
    name: playerSessionCookieName,
    value: playerSessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: playerSessionDurationSeconds,
  });

  return Response.json({ user: publicPlayer(user) });
}
