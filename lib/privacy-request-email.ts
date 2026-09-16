import { getAppBaseUrl } from "@/lib/app-url";
import { getPin2WinNotificationEmails } from "@/lib/notification-email-recipients";
import { getPrismaClient } from "@/lib/prisma";

async function sendEmail(input: { to: string[]; subject: string; text: string; idempotencyKey: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Privacy-request email delivery is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text }),
  });
  if (!response.ok) throw new Error(`Privacy-request email delivery failed (${response.status}).`);
}

export async function deliverPrivacyRequestEmails(limit = 25) {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for privacy-request delivery.");
  const events = await prisma.privacyRequestEvent.findMany({
    where: { OR: [
      { deliveries: { none: { audience: "Customer" } } },
      { deliveries: { none: { audience: "Staff" } } },
    ] },
    include: { request: true, deliveries: true }, orderBy: { createdAt: "asc" }, take: limit,
  });
  let delivered = 0;
  for (const event of events) {
    const customerShouldReceive = ["Submitted", "Need Verification", "Extend", "Complete", "Decline"].includes(event.action);
    if (!event.deliveries.some(d => d.audience === "Customer")) {
      if (customerShouldReceive) {
        const appealText = event.action === "Decline"
          ? event.request.userId
            ? "\nYou may appeal this decision through your Pin2Win privacy-request page. If your appeal is denied, you may submit a complaint to the Texas Attorney General."
            : "\nYou may appeal this decision by emailing pin2wingolf@outlook.com with this request reference. If your appeal is denied, you may submit a complaint to the Texas Attorney General."
          : "";
        const actionUrl = event.request.userId
          ? `${getAppBaseUrl()}/account/privacy`
          : `${getAppBaseUrl()}/privacy-request`;
        await sendEmail({
          to: [event.request.email], subject: `Pin2Win privacy request ${event.action.toLowerCase()} - ${event.request.id}`,
          text: `Privacy request: ${event.request.id}\nAction: ${event.action}\n${event.request.userId ? "A new message or decision is available in your signed-in account." : (event.customerText || "Please contact pin2wingolf@outlook.com with this reference to verify identity.")}${appealText}\n\nPrivacy request information: ${actionUrl}`,
          idempotencyKey: `privacy-customer-${event.id}`,
        });
      }
      await prisma.privacyRequestEmailDelivery.upsert({
        where: { eventId_audience: { eventId: event.id, audience: "Customer" } },
        create: { eventId: event.id, audience: "Customer" }, update: {},
      });
      delivered++;
    }
    if (!event.deliveries.some(d => d.audience === "Staff")) {
      await sendEmail({
        to: getPin2WinNotificationEmails(), subject: `Pin2Win privacy request review - ${event.request.id}`,
        text: `Request ${event.request.id}\nType: ${event.request.requestType}\nStatus: ${event.request.status}\nAction: ${event.action}\nCustomer: ${event.request.email}\nDue: ${event.request.dueAt.toISOString()}\n\nReview: ${getAppBaseUrl()}/admin/privacy`,
        idempotencyKey: `privacy-staff-${event.id}`,
      });
      await prisma.privacyRequestEmailDelivery.upsert({
        where: { eventId_audience: { eventId: event.id, audience: "Staff" } },
        create: { eventId: event.id, audience: "Staff" }, update: {},
      });
      delivered++;
    }
  }
  return delivered;
}
