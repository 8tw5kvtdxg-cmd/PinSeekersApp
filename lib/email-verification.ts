import { createHash, randomBytes } from "node:crypto";
import { resolveMx } from "node:dns/promises";
import { getPrismaClient } from "@/lib/prisma";

const verificationTokenDurationMs = 1000 * 60 * 60 * 24;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getAppBaseUrl(request?: Request) {
  const configuredUrl =
    process.env.PIN2WIN_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL;

  if (configuredUrl) {
    return configuredUrl.startsWith("http")
      ? configuredUrl
      : `https://${configuredUrl}`;
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
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

  const tokenHash = hashToken(token);
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (
    !verificationToken ||
    verificationToken.usedAt ||
    verificationToken.expiresAt < new Date()
  ) {
    return { ok: false, error: "Verification link is invalid or expired." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationToken.updateMany({
      where: {
        userId: verificationToken.userId,
        usedAt: null,
        id: { not: verificationToken.id },
      },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true, email: verificationToken.email };
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
