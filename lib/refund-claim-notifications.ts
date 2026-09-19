export type ClaimNotificationEvent = {
  id: string;
  action: string;
  note: string | null;
  customerMessage: string | null;
  meta: unknown;
  deliveries: { audience: string }[];
  claim: {
    id: string; checkoutId: string; playerEmail: string; reason: string;
    status: string; venueName: string | null; incidentAt: Date | null;
    narrative: string; evidenceReference: string | null;
    lateSubmissionFlag: boolean;
  };
};
export type ClaimEmail = { to: string[]; subject: string; text: string; idempotencyKey: string };

export function claimNotificationMessages(event: ClaimNotificationEvent, baseUrl: string, staffEmails: string[]) {
  const submitted = event.action === "Submitted";
  const action = event.action === "Refund response uncertain" ? "Refund processing needs verification"
    : event.action === "Refund reserved" ? "Refund requested" : event.action;
  const meta = event.meta && typeof event.meta === "object" && !Array.isArray(event.meta)
    ? event.meta as Record<string, unknown> : {};
  const amount = Number(meta.amountCents);
  const details = [
    `Refund claim: ${event.claim.id}`,
    `Payment reference: ${event.claim.checkoutId}`,
    `Reason: ${event.claim.reason}`,
    `Venue: ${event.claim.venueName || "Not supplied"}`,
    `Incident: ${event.claim.incidentAt?.toISOString() || "Not supplied"}`,
    `Update: ${action}`,
    `Current status: ${event.claim.status}`,
    Number.isSafeInteger(amount) && amount > 0 ? `Refund amount: $${(amount / 100).toFixed(2)}` : "",
    event.customerMessage ? `Explanation: ${event.customerMessage}` : "",
    submitted ? `Customer description:\n${event.claim.narrative}` : "",
    submitted && event.claim.evidenceReference ? `Evidence reference: ${event.claim.evidenceReference}` : "",
  ].filter(Boolean).join("\n");
  return {
    Customer: {
      to: [event.claim.playerEmail],
      subject: `Pin2Win refund claim ${submitted ? "received" : "update"} - ${event.claim.id}`,
      text: `${submitted ? "We received your refund claim. Our team will review the information and supporting evidence. Submission does not guarantee a refund.\n\n" : ""}${details}\n\nView your claim: ${baseUrl}/account/payment-issue`,
      idempotencyKey: `refund-customer-${event.id}`,
    },
    Staff: {
      to: staffEmails,
      subject: `Pin2Win ${submitted ? "new refund claim for review" : "refund review update"} - ${event.claim.id}`,
      text: `${details}\nCustomer: ${event.claim.playerEmail}\nInternal action: ${event.action}${event.note ? `\nInternal review note: ${event.note}` : ""}\nTiming flag: ${event.claim.lateSubmissionFlag ? "yes" : "no"}\n\nReview the claim and any uploaded evidence in the admin portal: ${baseUrl}/admin/refunds\nAdministrator review is required before any refund.`,
      idempotencyKey: `refund-staff-${event.id}`,
    },
  } satisfies Record<string, ClaimEmail>;
}

export async function deliverClaimEvent(input: {
  event: ClaimNotificationEvent; baseUrl: string; staffEmails: string[];
  send: (email: ClaimEmail) => Promise<void>;
  recordDelivery: (audience: "Customer" | "Staff") => Promise<void>;
}) {
  const messages = claimNotificationMessages(input.event, input.baseUrl, input.staffEmails);
  let delivered = 0;
  const failed: string[] = [];
  for (const audience of ["Customer", "Staff"] as const) {
    if (input.event.deliveries.some(delivery => delivery.audience === audience)) continue;
    try {
      await input.send(messages[audience]);
      await input.recordDelivery(audience);
      delivered++;
    } catch {
      // One recipient group must not block the other. Missing delivery records
      // are retried with the same provider idempotency key by the scheduled job.
      failed.push(audience);
    }
  }
  return { delivered, failed };
}
