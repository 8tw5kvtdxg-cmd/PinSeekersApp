import { getAppBaseUrl } from "@/lib/app-url";
import { getPrismaClient } from "@/lib/prisma";

export async function deliverParticipationHoldEmails(limit = 20) {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for participation-hold emails.");
  const events = await prisma.participationHoldEvent.findMany({
    where: { customerNotifiedAt: null }, include: { hold: { include: { user: { select: { email: true } } } } },
    orderBy: { createdAt: "asc" }, take: limit,
  });
  if (!events.length) return 0;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Participation-hold email is not configured.");
  let delivered = 0;
  for (const event of events) {
    const isHold = event.action === "Hold";
    const text = isHold
      ? `Your Pin2Win account is under an eligibility review. New paid entries and simulator-code access are paused. If you have already paid, do not pay again. Contact pin2wingolf@outlook.com with your entry or payment reference. No refund has been issued automatically.\n\nPayment help: ${getAppBaseUrl()}/account/payment-issue`
      : `The eligibility review hold on your Pin2Win account has been released. If you already paid and still cannot access your entry, contact pin2wingolf@outlook.com.\n\nYour account: ${getAppBaseUrl()}/account`;
    const response = await fetch("https://api.resend.com/emails", { method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `participation-hold-${event.id}` },
      body: JSON.stringify({ from, to: [event.hold.user.email], subject: isHold ? "Pin2Win account eligibility review" : "Pin2Win account review completed", text }),
    });
    if (!response.ok) throw new Error(`Participation-hold email delivery failed (${response.status}).`);
    await prisma.participationHoldEvent.updateMany({ where: { id: event.id, customerNotifiedAt: null }, data: { customerNotifiedAt: new Date() } });
    delivered++;
  }
  return delivered;
}
