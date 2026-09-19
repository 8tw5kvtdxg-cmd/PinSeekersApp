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
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text }),
  });
  if (!response.ok) throw new Error(`Refund claim email delivery failed (${response.status}).`);
}

export async function deliverPaymentIssueCommunications(limit = 30) {
  const prisma = database();
  const events = await prisma.paymentIssueEvent.findMany({
    where: {
      AND: [refundNotificationEventWhere],
      OR: [
      { deliveries: { none: { audience: "Customer" } } },
      { deliveries: { none: { audience: "Staff" } } },
    ] },
    include: { claim: true, deliveries: true }, orderBy: { createdAt: "asc" }, take: limit,
  });
  let delivered = 0;
  for (const event of events) {
    const customerUrl = `${getAppBaseUrl()}/account/payment-issue`;
    const staffUrl = `${getAppBaseUrl()}/admin/refunds`;
    const customerAction = event.action === "Refund response uncertain" ? "Refund processing needs verification"
      : event.action === "Refund reserved" ? "Refund requested"
      : event.action === "Paid without entry detected" ? "Payment confirmed but entry is not yet available"
      : event.action;
    const eventMeta = event.meta && typeof event.meta === "object" && !Array.isArray(event.meta)
      ? event.meta as Record<string, unknown> : {};
    const amountCents = Number(eventMeta.amountCents);
    const customerMessage = [
      `Payment or refund claim: ${event.claim.id}`,
      `Payment reference: ${event.claim.checkoutId}`,
      `Update: ${customerAction}`,
      `Current status: ${event.claim.status}`,
      Number.isSafeInteger(amountCents) && amountCents > 0 ? `Refund amount: $${(amountCents / 100).toFixed(2)}` : "",
      event.customerMessage ? `Explanation: ${event.customerMessage}` : "",
    ].filter(Boolean).join("\n");
    const staffMessage = `${customerMessage}\nInternal action: ${event.action}${event.note ? `\nInternal review note: ${event.note}` : ""}`;
    try {
      if (!event.deliveries.some(delivery => delivery.audience === "Customer")) {
        await sendEmail({
          to: [event.claim.playerEmail], subject: `Pin2Win payment claim update - ${event.claim.id}`,
          text: `${customerMessage}\n\nView your claim: ${customerUrl}`,
          idempotencyKey: `refund-customer-${event.id}`,
        });
        await prisma.paymentIssueEmailDelivery.upsert({
          where: { eventId_audience: { eventId: event.id, audience: "Customer" } },
          create: { eventId: event.id, audience: "Customer" }, update: {},
        });
        delivered++;
      }
      if (!event.deliveries.some(delivery => delivery.audience === "Staff")) {
        await sendEmail({
          to: getPin2WinNotificationEmails(), subject: `Pin2Win refund review - ${event.claim.id}`,
          text: `${staffMessage}\nCustomer: ${event.claim.playerEmail}\nTiming flag: ${event.claim.lateSubmissionFlag ? "yes" : "no"}\n\nReview: ${staffUrl}`,
          idempotencyKey: `refund-staff-${event.id}`,
        });
        await prisma.paymentIssueEmailDelivery.upsert({
          where: { eventId_audience: { eventId: event.id, audience: "Staff" } },
          create: { eventId: event.id, audience: "Staff" }, update: {},
        });
        delivered++;
      }
    } catch (error) {
      console.error("Refund claim communication pending retry.", event.id, error);
    }
  }
  return { scanned: events.length, delivered };
}
