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
  getSquareOrder,
  squareOrderLooksPaid,
  verifySquareWebhookSignature,
} from "@/lib/square";
import { recordTransactionAuditEvent } from "@/lib/transaction-audit";

export const dynamic = "force-dynamic";

function findOrderId(payload: unknown) {
  const text = JSON.stringify(payload);
  const match =
    text.match(/"order_id"\s*:\s*"([^"]+)"/) ||
    text.match(/"orderId"\s*:\s*"([^"]+)"/);

  return match?.[1] ?? "";
}

function findPaymentId(payload: unknown) {
  const text = JSON.stringify(payload);
  const match =
    text.match(/"payment_id"\s*:\s*"([^"]+)"/) ||
    text.match(/"paymentId"\s*:\s*"([^"]+)"/) ||
    text.match(/"id"\s*:\s*"(?:payment:)?([^"]+)"/);

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

  const orderId = findOrderId(payload);

  if (!orderId) {
    return Response.json({ received: true, matched: false });
  }

  const checkout = await getSquareCheckoutRecordByOrderId(orderId);

  if (!checkout) {
    return Response.json({ received: true, matched: false });
  }

  const squareOrder = await getSquareOrder({ orderId: checkout.squareOrderId });

  if (!squareOrderLooksPaid(squareOrder, checkout.amountCents)) {
    return Response.json({ received: true, matched: true, status: checkout.status });
  }

  const updatedCheckout = await updateSquareCheckoutRecord(checkout.id, {
    squarePaymentId: findPaymentId(payload) || checkout.squarePaymentId,
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
