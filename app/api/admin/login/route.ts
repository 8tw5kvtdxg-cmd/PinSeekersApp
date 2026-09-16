import { NextResponse } from "next/server";
import {
  isAdminEmail,
} from "@/lib/admin-auth";
import {
  createAdminLoginChallenge,
  sendAdminLoginCode,
} from "@/lib/admin-mfa";
import { getPrismaClient } from "@/lib/prisma";
import { normalizeEmail, verifyPassword } from "@/lib/player-auth";
import {
  consumeRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (
    typeof value !== "string" ||
    !(
      value === "/admin" ||
      value.startsWith("/admin/") ||
      value === "/testing-portal" ||
      value.startsWith("/testing-portal/")
    )
  ) {
    return "/admin";
  }

  return value.startsWith("/admin/login") ? "/admin" : value;
}

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const formData = await request.formData();
  const login = formData.get("login");
  const password = formData.get("password");
  const nextPath = getSafeNextPath(formData.get("next"));
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", nextPath);
  const loginValue = typeof login === "string" ? login.trim() : "";
  const rateLimit = await consumeRateLimit({
    namespace: "admin-login",
    identifier: getClientIp(request),
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    loginUrl.searchParams.set("error", "rate-limit");
    return NextResponse.redirect(loginUrl, {
      status: 303,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    loginUrl.searchParams.set("error", "unavailable");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const normalizedEmail = normalizeEmail(loginValue);
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { username: loginValue }] },
    select: { id: true, email: true, passwordHash: true },
  });

  if (
    typeof password !== "string" ||
    !user ||
    !isAdminEmail(user.email) ||
    !verifyPassword(password, user.passwordHash)
  ) {
    loginUrl.searchParams.set("error", "credentials");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  try {
    const challenge = await createAdminLoginChallenge(user.id);
    await sendAdminLoginCode({ email: user.email, code: challenge.code });
    loginUrl.searchParams.set("challenge", challenge.id);
    loginUrl.searchParams.delete("error");
    return NextResponse.redirect(loginUrl, { status: 303 });
  } catch (error) {
    console.error("Administrator MFA challenge could not be sent.", error);
    loginUrl.searchParams.set("error", "unavailable");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }
}
