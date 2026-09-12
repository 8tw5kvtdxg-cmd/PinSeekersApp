import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import {
  getPlayerSessionExpiry,
  isPlayerSessionExpired,
  shouldTouchPlayerSession,
} from "./player-session-policy.ts";

export { playerSessionDurationSeconds } from "./player-session-policy.ts";

export const playerSessionCookieName = "pin2win_player_session";

const passwordKeyLength = 64;

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
  return username.trim();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, passwordKeyLength).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const hash = scryptSync(password, salt, passwordKeyLength).toString("hex");

  return safeEqual(hash, storedHash);
}

export async function createPlayerSession(userId: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is required for player sessions.");
  }

  const token = randomBytes(32).toString("base64url");
  const now = new Date();

  await prisma.playerSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      lastActivityAt: now,
      expiresAt: getPlayerSessionExpiry(now),
    },
  });

  return token;
}

export async function getActivePlayerSession(
  token: string | undefined,
  options: { touch?: boolean } = {},
) {
  const prisma = getPrismaClient();

  if (!prisma || !token) {
    return null;
  }

  const session = await prisma.playerSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
  });
  const now = new Date();

  if (!session || isPlayerSessionExpired(session.expiresAt, now)) {
    if (session) {
      await prisma.playerSession.deleteMany({ where: { id: session.id } });
    }

    return null;
  }

  if (
    options.touch !== false &&
    shouldTouchPlayerSession(session.lastActivityAt, now)
  ) {
    await prisma.playerSession.updateMany({
      where: { id: session.id, expiresAt: { gt: now } },
      data: {
        lastActivityAt: now,
        expiresAt: getPlayerSessionExpiry(now),
      },
    });
  }

  return session;
}

export async function deletePlayerSession(token: string | undefined) {
  const prisma = getPrismaClient();

  if (!prisma || !token) {
    return;
  }

  await prisma.playerSession.deleteMany({
    where: { tokenHash: hashSessionToken(token) },
  });
}

export async function deletePlayerSessionsForUser(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    await prisma.playerSession.deleteMany({ where: { userId } });
  }
}

export async function getCurrentPlayer() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return null;
  }

  const cookieStore = await cookies();
  const session = await getActivePlayerSession(
    cookieStore.get(playerSessionCookieName)?.value,
  );

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      simulatorDisplayName: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
}

export async function getCurrentVerifiedPlayer() {
  const player = await getCurrentPlayer();

  if (!player) {
    return {
      player: null,
      error: "Login required before entering a challenge.",
      status: 401,
    } as const;
  }

  return { player, error: null, status: 200 } as const;
}

export function publicPlayer(user: {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  simulatorDisplayName?: string | null;
  emailVerifiedAt?: Date | null;
}) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone ?? "",
    simulatorDisplayName: user.simulatorDisplayName ?? "",
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}
