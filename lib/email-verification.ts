import { createHash, randomBytes } from "node:crypto";
import { resolveMx } from "node:dns/promises";
import { getAppBaseUrl } from "@/lib/app-url";
import { getPrismaClient } from "@/lib/prisma";

import { verificationReturnPath } from "./verification-return-path.ts";

const verificationTokenDurationMs = 1000 * 60 * 60 * 24;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isEmailFormatValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function validateEmailForSignup(email: string) {
  if (!isEmailFormatValid(email)) {
    return "Enter a valid email address.";
  }

  if (process.env.PIN2WIN_SKIP_EMAIL_DNS_CHECK === "true") {
    return null;
  }

  const domain = email.split("@")[1];

  try {
    const records = await resolveMx(domain);

    if (records.length === 0) {
      return "That email domain cannot receive email.";
    }
  } catch {
    return "That email domain cannot receive email.";
  }

  return null;
}

export async function createEmailVerificationToken(input: {
  userId: string;
  email: string;
  returnTo?: unknown;
}) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + verificationTokenDurationMs);

  await prisma.emailVerificationToken.create({
    data: {
      userId: input.userId,
      email: input.email,
      tokenHash: hashToken(token),
      returnTo: verificationReturnPath(input.returnTo),
      expiresAt,
    },
  });

  return token;
}

export async function verifyEmailToken(token: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return { ok: false, error: "Database is not configured." };
  }

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const record = await tx.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.usedAt || record.expiresAt <= now) return { ok: false, error: "Verification link is invalid or expired." };
    const claimed = await tx.emailVerificationToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
    if (claimed.count !== 1) return { ok: false, error: "Verification link has already been used." };
    const updated = await tx.user.updateMany({ where: { id: record.userId, email: record.email }, data: { emailVerifiedAt: now } });
    if (updated.count !== 1) throw new Error("Email address has changed. Request a new verification link.");
    return { ok: true, email: record.email, returnTo: verificationReturnPath(record.returnTo) };
  });
}

export async function sendEmailVerification(input: {
  email: string;
  username: string;
  token: string;
  request?: Request;
}) {
  const verificationUrl = `${getAppBaseUrl(input.request)}/api/account/verify-email?token=${input.token}`;
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;

  if (resendApiKey && from) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.email,
        subject: "Verify your Pin2Win email",
        text: [
          `Hi ${input.username},`,
          "",
          "Verify your Pin2Win account email with this link:",
          verificationUrl,
          "",
          "This link expires in 24 hours.",
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      throw new Error("Verification email could not be sent.");
    }

    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Email delivery is not configured.");
  }

  console.info(`Pin2Win email verification link for ${input.email}: ${verificationUrl}`);
}
