import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { getPrismaClient } from "@/lib/prisma";

const challengeDurationMs = 10 * 60 * 1000;
const maximumAttempts = 5;

function mfaSecret() {
  const secret =
    process.env.PIN2WIN_ADMIN_MFA_SECRET ||
    process.env.PIN2WIN_ADMIN_SESSION_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("Administrator MFA is not configured.");
  }

  return secret || "pin2win-local-admin-mfa-secret";
}

function hashCode(challengeId: string, code: string) {
  return createHmac("sha256", mfaSecret())
    .update(`${challengeId}.${code}`)
    .digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function createAdminLoginChallenge(userId: string) {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for administrator MFA.");

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + challengeDurationMs);
  const challenge = await prisma.adminLoginChallenge.create({
    data: { userId, codeHash: "pending", expiresAt },
  });
  await prisma.adminLoginChallenge.update({
    where: { id: challenge.id },
    data: { codeHash: hashCode(challenge.id, code) },
  });

  return { id: challenge.id, code, expiresAt };
}

export async function sendAdminLoginCode(input: {
  email: string;
  code: string;
}) {
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
        subject: "Your Pin2Win administrator verification code",
        text: [
          "A login was attempted for your Pin2Win administrator account.",
          "",
          `Verification code: ${input.code}`,
          "",
          "This code expires in 10 minutes and can be used only once.",
          "If you did not attempt to sign in, reset your password immediately.",
        ].join("\n"),
      }),
    });

    if (!response.ok) throw new Error("Administrator verification email failed.");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Administrator verification email is not configured.");
  }

  console.info(`Pin2Win administrator verification code: ${input.code}`);
}

export async function verifyAdminLoginChallenge(input: {
  challengeId: string;
  code: string;
}) {
  const prisma = getPrismaClient();
  if (!prisma) return null;

  const challenge = await prisma.adminLoginChallenge.findUnique({
    where: { id: input.challengeId },
    include: { user: { select: { id: true, email: true } } },
  });
  const now = new Date();

  if (
    !challenge ||
    challenge.usedAt ||
    challenge.expiresAt <= now ||
    challenge.attempts >= maximumAttempts
  ) {
    return null;
  }

  const valid = safeEqual(
    challenge.codeHash,
    hashCode(challenge.id, input.code),
  );

  if (!valid) {
    await prisma.adminLoginChallenge.updateMany({
      where: { id: challenge.id, usedAt: null },
      data: { attempts: { increment: 1 } },
    });
    return null;
  }

  const claimed = await prisma.adminLoginChallenge.updateMany({
    where: {
      id: challenge.id,
      usedAt: null,
      expiresAt: { gt: now },
      attempts: { lt: maximumAttempts },
    },
    data: { usedAt: now },
  });

  return claimed.count === 1 ? challenge.user : null;
}
