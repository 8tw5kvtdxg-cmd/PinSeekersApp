import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const adminSessionCookieName = "pin2win_admin_session";

const sessionDurationMs = 1000 * 60 * 60 * 8;
const builtInAdminEmails = ["sanchez.pete07@gmail.com"];

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getAdminUsername() {
  return process.env.PIN2WIN_ADMIN_USERNAME ?? (
    process.env.NODE_ENV === "production" ? "" : "Pin2Win_Admin"
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

function encodeSessionIdentity(identity: string) {
  return Buffer.from(identity, "utf8").toString("base64url");
}

function decodeSessionIdentity(value: string) {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return "";
  }
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

export function createAdminSessionValue(identity = getAdminUsername()) {
  const expiresAt = Date.now() + sessionDurationMs;
  const sessionIdentity = identity.trim();
  const signature = signSession(sessionIdentity, expiresAt);

  return `v2.${encodeSessionIdentity(sessionIdentity)}.${expiresAt}.${signature}`;
}

export function verifyAdminSessionValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  const parts = value.split(".");
  const isV2Session = parts[0] === "v2";
  const username = isV2Session ? decodeSessionIdentity(parts[1] ?? "") : parts[0];
  const expiresAtValue = isV2Session ? parts[2] : parts[1];
  const signature = isV2Session ? parts[3] : parts[2];
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
    Boolean(getAdminSessionSecret()) &&
    ((Boolean(adminUsername) && safeEqual(username, adminUsername)) ||
      isAdminEmail(username)) &&
    safeEqual(signature, expectedSignature)
  );
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminSessionValue(
    cookieStore.get(adminSessionCookieName)?.value,
  );
}

export async function isAdminRequestAuthenticated(request: Request) {
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
