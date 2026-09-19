import { deliverClaimEvent } from "./refund-claim-notifications";
import { refundNotificationEventWhere } from "@/lib/refund-claim-source";
import { getAppBaseUrl } from "@/lib/app-url";
import { getPin2WinNotificationEmails } from "@/lib/notification-email-recipients";
import { getPrismaClient } from "@/lib/prisma";

function database() {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for refund communication.");
  return prisma;
}

async function sendEmail(input: { to: string[]; subject: string; text: string; idempotencyKey: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") throw new Error("Refund email delivery is not configured.");
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text }),
  });
  if (!response.ok) throw new Error(`Refund claim email delivery failed (${response.status}).`);
}

export async function deliverPaymentIssueCommunications(limit = 30, claimId?: string) {
  const prisma = database();
  const events = await prisma.paymentIssueEvent.findMany({
    where: {
      ...(claimId ? { claimId } : {}),
      AND: [refundNotificationEventWhere],
      OR: [
      { deliveries: { none: { audience: "Customer" } } },
      { deliveries: { none: { audience: "Staff" } } },
    ] },
    include: { claim: true, deliveries: true }, orderBy: { createdAt: "asc" }, take: limit,
  });
  let delivered = 0;
  for (const event of events) {
    const result = await deliverClaimEvent({
      event, baseUrl: getAppBaseUrl(), staffEmails: getPin2WinNotificationEmails(),
      send: sendEmail,
      recordDelivery: async audience => {
        await prisma.paymentIssueEmailDelivery.upsert({
          where: { eventId_audience: { eventId: event.id, audience } },
          create: { eventId: event.id, audience }, update: {},
        });
      },
    });
    delivered += result.delivered;
    if (result.failed.length) console.error("Refund claim communication pending retry.", event.id, result.failed);
  }

  return { scanned: events.length, delivered };
}
