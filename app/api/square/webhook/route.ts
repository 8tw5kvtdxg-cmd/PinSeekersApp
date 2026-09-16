import {
  createClubhouseEntryRecord,
  getClubhouseEntryRecordBySquareCheckoutId,
} from "@/lib/clubhouse-entry-store";
import { findOrCreateCheckoutEntry } from "@/lib/payment-idempotency";
import {
  getSquareCheckoutRecordByOrderId,
  updateSquareCheckoutRecord,
} from "@/lib/square-checkout-store";
import { sendPaymentConfirmationEmails } from "@/lib/payment-confirmation-email";
import {
  getSquarePaymentId,
  getSquarePaymentCreatedAt,
  squarePaymentLooksPaid,
  verifySquareWebhookSignature,
  verifySquareOrderPayment,
} from "@/lib/square";
import { recordTransactionAuditEvent } from "@/lib/transaction-audit";
import { reconcileSquareRefundById } from "@/lib/refund-claims";
import { deliverPaymentIssueCommunications } from "@/lib/refund-claim-email";
import { activeParticipationHoldByEmail } from "@/lib/participation-holds";

export const dynamic = "force-dynamic";

function findOrderId(payload: unknown) {
  const text = JSON.stringify(payload);
  const match =
    text.match(/"order_id"\s*:\s*"([^"]+)"/) ||
    text.match(/"orderId"\s*:\s*"([^"]+)"/);

  return match?.[1] ?? "";
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifySquareWebhookSignature({ request, rawBody })) {
    return Response.json({ error: "Invalid Square webhook signature." }, { status: 403 });
  }

  let payload: unknown = null;

  try {
    payload = JSON.parse(rawBody || "null") as unknown;
  } catch {
    return Response.json({ received: false }, { status: 400 });
  }

  if (!payload) {
    return Response.json({ received: false }, { status: 400 });
  }

  const eventType = typeof payload === "object" && payload && "type" in payload
    ? String((payload as { type?: unknown }).type ?? "") : "";
  if (eventType.startsWith("refund.")) {
    // The signed webhook is only a trigger; fetch authoritative refund state from Square.
    const data = typeof payload === "object" && payload && "data" in payload
      ? (payload as { data?: unknown }).data : null;
    const refundId = data && typeof data === "object" && "id" in data && typeof data.id === "string" ? data.id : "";
    if (!refundId) return Response.json({ received: true, matched: false });
    try {
      const matched = await reconcileSquareRefundById(refundId);
      if (matched) await deliverPaymentIssueCommunications(10).catch((error) => console.error("Refund update email pending retry.", error));
      return Response.json({ received: true, matched, refundReconciled: matched });
    } catch (error) {
      console.error("Square refund webhook reconciliation failed.", refundId, error);
      return Response.json({ error: "Refund reconciliation failed." }, { status: 500 });
    }
  }

  const orderId = findOrderId(payload);

  if (!orderId) {
    return Response.json({ received: true, matched: false });
  }

  const checkout = await getSquareCheckoutRecordByOrderId(orderId);

  if (!checkout) {
    return Response.json({ received: true, matched: false });
  }

  const paymentCheck = {
    amountCents: checkout.amountCents,
    orderId: checkout.squareOrderId,
  };
  const webhookPaymentIsPaid = squarePaymentLooksPaid(payload, paymentCheck);
  const squareVerification = webhookPaymentIsPaid
    ? { isPaid: true, paymentId: getSquarePaymentId(payload), paymentCreatedAt: getSquarePaymentCreatedAt(payload) }
    : await verifySquareOrderPayment(paymentCheck);

  if (!squareVerification.isPaid) {
    return Response.json({ received: true, matched: true, status: checkout.status });
  }

  const updatedCheckout = await updateSquareCheckoutRecord(checkout.id, {
    squarePaymentId: squareVerification.paymentId || checkout.squarePaymentId,
    squarePaidAt: squareVerification.paymentCreatedAt || checkout.squarePaidAt,
    status: "Succeeded",
  });
  await recordTransactionAuditEvent({
    checkoutId: updatedCheckout.id,
    provider: "square",
    event: "payment_confirmed",
    status: "Succeeded",
    meta: {
      squareOrderId: updatedCheckout.squareOrderId,
      squarePaymentId: updatedCheckout.squarePaymentId ?? "",
    },
  });
  const existingEntry = await getClubhouseEntryRecordBySquareCheckoutId(
    updatedCheckout.id,
  );
  const entry = await findOrCreateCheckoutEntry({
    findExisting: async () => existingEntry,
    createEntry: async () => {
      const createdEntry = await createClubhouseEntryRecord({
        challengeSlug: updatedCheckout.challengeSlug,
        playerName: updatedCheckout.playerName,
        playerEmail: updatedCheckout.playerEmail,
        phoneNumber: updatedCheckout.phoneNumber,
        e6DisplayName: updatedCheckout.e6DisplayName,
        squareCheckoutId: updatedCheckout.id,
        squareOrderId: updatedCheckout.squareOrderId,
        squarePaymentId: updatedCheckout.squarePaymentId,
        acceptedConsentRecordId: updatedCheckout.acceptedConsentRecordId,
        acceptedDocumentVersion: updatedCheckout.acceptedDocumentVersion,
        acceptedPackageHash: updatedCheckout.acceptedPackageHash,
        venueBookingReference: `Square order ${updatedCheckout.squareOrderId}`,
        locationSlug: updatedCheckout.locationSlug,
        locationName: updatedCheckout.locationName,
        bayName: updatedCheckout.bayName,
      });

      await updateSquareCheckoutRecord(updatedCheckout.id, {
        entryId: createdEntry.id,
      });

      return createdEntry;
    },
    recoverExisting: async () =>
      await getClubhouseEntryRecordBySquareCheckoutId(updatedCheckout.id),
  });

  if (!existingEntry) {
    await recordTransactionAuditEvent({
      checkoutId: updatedCheckout.id,
      provider: "square",
      event: "entry_created",
      status: "Succeeded",
      meta: { entryId: entry.id },
    });
  }

  if (!updatedCheckout.confirmationEmailSentAt) {
    try {
      await sendPaymentConfirmationEmails({
        checkout: updatedCheckout,
        entry,
        request,
        eligibilityHeld: await activeParticipationHoldByEmail(updatedCheckout.playerEmail),
        onAudienceSent: async (audience) => {
          await updateSquareCheckoutRecord(updatedCheckout.id, {
            [audience === "staff" ? "staffEmailSentAt" : "playerEmailSentAt"]: new Date().toISOString(),
          });
        },
      });
      await updateSquareCheckoutRecord(updatedCheckout.id, {
        confirmationEmailSentAt: new Date().toISOString(),
      });
      await recordTransactionAuditEvent({
        checkoutId: updatedCheckout.id,
        provider: "square",
        event: "confirmation_emails_sent",
        status: "Succeeded",
        meta: { entryId: entry.id },
      });
    } catch (error) {
      await recordTransactionAuditEvent({
        checkoutId: updatedCheckout.id,
        provider: "square",
        event: "confirmation_emails_failed",
        status: "Failed",
        meta: { entryId: entry.id },
      });
      throw error;
    }
  }

  return Response.json({
    received: true,
    matched: true,
    entryId: entry.id,
  });
}
