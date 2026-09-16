import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

export const adminSessionCookieName = "pin2win_admin_session";
export const adminSessionIdleSeconds = 60 * 60;

const adminSessionAbsoluteDurationMs = 1000 * 60 * 60 * 8;
const adminSessionTouchIntervalMs = 1000 * 60 * 5;
const builtInAdminEmails = ["sanchez.pete07@gmail.com"];

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getAdditionalAdminEmails() {
  return [
    ...builtInAdminEmails,
    ...(process.env.PIN2WIN_ADMIN_EMAILS ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean),
  ];
}

export function isAdminEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  return getAdditionalAdminEmails().some((adminEmail) =>
    safeEqual(normalizedEmail, adminEmail),
  );
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return new Map<string, string>();

  return new Map(
    cookieHeader.split(";").map((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      return [name, decodeURIComponent(valueParts.join("="))];
    }),
  );
}

export async function createAdminSession(userId: string) {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for admin sessions.");

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + adminSessionIdleSeconds * 1000);
  const absoluteExpiresAt = new Date(
    now.getTime() + adminSessionAbsoluteDurationMs,
  );

  await prisma.$transaction([
    prisma.adminSession.deleteMany({
      where: {
        userId,
        OR: [{ expiresAt: { lte: now } }, { absoluteExpiresAt: { lte: now } }],
      },
    }),
    prisma.adminSession.create({
      data: {
        userId,
        tokenHash: hashSessionToken(token),
        lastActivityAt: now,
        expiresAt,
        absoluteExpiresAt,
      },
    }),
  ]);

  return token;
}

async function getAdminSession(token: string | undefined, touch = true) {
  const prisma = getPrismaClient();
  if (!prisma || !token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  const now = new Date();

  if (
    !session ||
    session.expiresAt <= now ||
    session.absoluteExpiresAt <= now ||
    !isAdminEmail(session.user.email)
  ) {
    if (session) {
      await prisma.adminSession.deleteMany({ where: { id: session.id } });
    }
    return null;
  }

  if (
    touch &&
    now.getTime() - session.lastActivityAt.getTime() >=
      adminSessionTouchIntervalMs
  ) {
    const rollingExpiry = new Date(
      Math.min(
        now.getTime() + adminSessionIdleSeconds * 1000,
        session.absoluteExpiresAt.getTime(),
      ),
    );

    await prisma.adminSession.updateMany({
      where: {
        id: session.id,
        expiresAt: { gt: now },
        absoluteExpiresAt: { gt: now },
      },
      data: { lastActivityAt: now, expiresAt: rollingExpiry },
    });
  }

  return session;
}

export async function deleteAdminSession(token: string | undefined) {
  const prisma = getPrismaClient();
  if (!prisma || !token) return;

  await prisma.adminSession.deleteMany({
    where: { tokenHash: hashSessionToken(token) },
  });
}

export async function deleteAdminSessionsForUser(userId: string) {
  const prisma = getPrismaClient();
  if (!prisma) return;

  await prisma.adminSession.deleteMany({ where: { userId } });
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return Boolean(
    await getAdminSession(cookieStore.get(adminSessionCookieName)?.value),
  );
}

export async function getAdminRequestIdentity(request: Request) {
  if (!isSameOriginRequest(request)) return null;

  const cookieMap = parseCookieHeader(request.headers.get("cookie"));
  const session = await getAdminSession(cookieMap.get(adminSessionCookieName));

  return session
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }
    : null;
}

export async function isAdminRequestAuthenticated(request: Request) {
  return Boolean(await getAdminRequestIdentity(request));
}

export async function requireAdminSession(nextPath?: string) {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/admin/login${next}`);
  }
}
