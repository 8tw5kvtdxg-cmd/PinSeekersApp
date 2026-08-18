import { createHash, randomBytes } from "node:crypto";
import { getPrismaClient } from "@/lib/prisma";

const resetTokenDurationMs = 1000 * 60 * 60;

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

export async function createPasswordResetToken(userId: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + resetTokenDurationMs);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return token;
}

export async function getPasswordResetToken(token: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return null;
  }

  return prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });
}

export async function sendAccountRecoveryEmail(input: {
  email: string;
  username: string;
  token: string;
  request?: Request;
}) {
  const resetUrl = `${getAppBaseUrl(input.request)}/account/reset?token=${input.token}`;
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;
  const text = [
    `Hi ${input.username},`,
    "",
    "We received a request to recover your Pin2Win account.",
    "",
    `Username: ${input.username}`,
    "",
    "Use this link to set a new password:",
    resetUrl,
    "",
    "This link expires in 1 hour. If you did not request this, you can ignore this email.",
  ].join("\n");

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
        subject: "Recover your Pin2Win account",
        text,
      }),
    });

    if (!response.ok) {
      throw new Error("Recovery email could not be sent.");
    }

    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Email delivery is not configured.");
  }

  console.info(`Pin2Win account recovery email for ${input.email}:\n${text}`);
}
