import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const adminSessionCookieName = "pin2win_admin_session";

const sessionDurationMs = 1000 * 60 * 60 * 8;

function getAdminUsername() {
  return process.env.PIN2WIN_ADMIN_USERNAME ?? (
    process.env.NODE_ENV === "production" ? "" : "admin"
  );
}

function getAdminPassword() {
  return process.env.PIN2WIN_ADMIN_PASSWORD ?? (
    process.env.NODE_ENV === "production" ? "" : "pin2win-admin"
  );
}

function getAdminSessionSecret() {
  return (
    process.env.PIN2WIN_ADMIN_SESSION_SECRET ??
    process.env.PIN2WIN_ADMIN_PASSWORD ??
    (process.env.NODE_ENV === "production"
      ? ""
      : "pin2win-local-admin-session-secret")
  );
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signSession(username: string, expiresAt: number) {
  return createHmac("sha256", getAdminSessionSecret())
    .update(`${username}.${expiresAt}`)
    .digest("hex");
}

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return new Map(
    cookieHeader.split(";").map((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");

      return [name, decodeURIComponent(valueParts.join("="))];
    }),
  );
}

export function validateAdminCredentials(username: string, password: string) {
  const adminUsername = getAdminUsername();
  const adminPassword = getAdminPassword();

  if (!adminUsername || !adminPassword) {
    return false;
  }

  return (
    safeEqual(username, adminUsername) &&
    safeEqual(password, adminPassword)
  );
}

export function createAdminSessionValue() {
  const username = getAdminUsername();
  const expiresAt = Date.now() + sessionDurationMs;
  const signature = signSession(username, expiresAt);

  return `${username}.${expiresAt}.${signature}`;
}

export function verifyAdminSessionValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  const [username, expiresAtValue, signature] = value.split(".");
  const expiresAt = Number(expiresAtValue);

  if (!username || !Number.isFinite(expiresAt) || !signature) {
    return false;
  }

  if (expiresAt < Date.now()) {
    return false;
  }

  const expectedSignature = signSession(username, expiresAt);
  const adminUsername = getAdminUsername();

  return (
    Boolean(adminUsername) &&
    Boolean(getAdminSessionSecret()) &&
    safeEqual(username, adminUsername) &&
    safeEqual(signature, expectedSignature)
  );
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();

  return verifyAdminSessionValue(
    cookieStore.get(adminSessionCookieName)?.value,
  );
}

export function isAdminRequestAuthenticated(request: Request) {
  const cookieMap = parseCookieHeader(request.headers.get("cookie"));

  return verifyAdminSessionValue(cookieMap.get(adminSessionCookieName));
}

export async function requireAdminSession(nextPath?: string) {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/admin/login${next}`);
  }
}
