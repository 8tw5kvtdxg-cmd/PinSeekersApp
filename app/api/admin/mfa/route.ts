import { NextResponse } from "next/server";
import {
  adminSessionCookieName,
  adminSessionIdleSeconds,
  createAdminSession,
  isAdminEmail,
} from "@/lib/admin-auth";
import { verifyAdminLoginChallenge } from "@/lib/admin-mfa";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";

function safeNextPath(value: FormDataEntryValue | null) {
  if (
    typeof value === "string" &&
    (value === "/admin" ||
      value.startsWith("/admin/") ||
      value === "/testing-portal" ||
      value.startsWith("/testing-portal/")) &&
    !value.startsWith("/admin/login")
  ) {
    return value;
  }
  return "/admin";
}

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const formData = await request.formData();
  const challengeId = String(formData.get("challenge") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const nextPath = safeNextPath(formData.get("next"));
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", nextPath);
  loginUrl.searchParams.set("challenge", challengeId);
  const rateLimit = await consumeRateLimit({
    namespace: "admin-mfa",
    identifier: getClientIp(request),
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    loginUrl.searchParams.set("error", "rate-limit");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (!/^\d{6}$/.test(code) || !challengeId) {
    loginUrl.searchParams.set("error", "mfa");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const user = await verifyAdminLoginChallenge({ challengeId, code });
  if (!user || !isAdminEmail(user.email)) {
    loginUrl.searchParams.set("error", "mfa");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), {
    status: 303,
  });
  response.cookies.set({
    name: adminSessionCookieName,
    value: await createAdminSession(user.id),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: adminSessionIdleSeconds,
  });
  return response;
}
