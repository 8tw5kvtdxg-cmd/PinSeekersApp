import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";

export const playerSessionCookieName = "pin2win_player_session";

const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;
const passwordKeyLength = 64;

function getPlayerSessionSecret() {
  return (
    process.env.PIN2WIN_PLAYER_SESSION_SECRET ??
    process.env.PIN2WIN_ADMIN_SESSION_SECRET ??
    (process.env.NODE_ENV === "production"
      ? ""
      : "pin2win-local-player-session-secret")
  );
}

function signSession(userId: string, expiresAt: number) {
  return createHmac("sha256", getPlayerSessionSecret())
    .update(`${userId}.${expiresAt}`)
    .digest("hex");
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

export function createPlayerSessionValue(userId: string) {
  const expiresAt = Date.now() + sessionDurationMs;
  const signature = signSession(userId, expiresAt);

  return `${userId}.${expiresAt}.${signature}`;
}

export function verifyPlayerSessionValue(value: string | undefined) {
  if (!value || !getPlayerSessionSecret()) {
    return null;
  }

  const [userId, expiresAtValue, signature] = value.split(".");
  const expiresAt = Number(expiresAtValue);

  if (!userId || !Number.isFinite(expiresAt) || !signature) {
    return null;
  }

  if (expiresAt < Date.now()) {
    return null;
  }

  const expectedSignature = signSession(userId, expiresAt);

  return safeEqual(signature, expectedSignature) ? userId : null;
}

export async function getCurrentPlayer() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return null;
  }

  const cookieStore = await cookies();
  const userId = verifyPlayerSessionValue(
    cookieStore.get(playerSessionCookieName)?.value,
  );

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
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

  if (!player.emailVerifiedAt) {
    return {
      player: null,
      error: "Verify your email before entering a challenge.",
      status: 403,
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
