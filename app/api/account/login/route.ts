import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { consumeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import {
  createPlayerSession,
  normalizeEmail,
  playerSessionDurationSeconds,
  playerSessionCookieName,
  publicPlayer,
  verifyPassword,
} from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const rateLimit = await consumeRateLimit({
    namespace: "account-login",
    identifier: getClientIp(request),
    limit: 10,
    windowMs: 15 * 60 * 1000,
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
