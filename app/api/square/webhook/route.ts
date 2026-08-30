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
import { squareOrderLooksPaid, verifySquareWebhookSignature } from "@/lib/square";

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

  if (!squareOrderLooksPaid(payload)) {
    return Response.json({ received: true, matched: true, status: checkout.status });
  }

  const updatedCheckout = await updateSquareCheckoutRecord(checkout.id, {
    squarePaymentId: findPaymentId(payload) || checkout.squarePaymentId,
    status: "Succeeded",
  });
  const entry = await findOrCreateCheckoutEntry({
    findExisting: async () =>
      await getClubhouseEntryRecordBySquareCheckoutId(updatedCheckout.id),
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

  if (!updatedCheckout.confirmationEmailSentAt) {
    await sendPaymentConfirmationEmails({
      checkout: updatedCheckout,
      entry,
      request,
    });
    await updateSquareCheckoutRecord(updatedCheckout.id, {
      confirmationEmailSentAt: new Date().toISOString(),
    });
  }

  return Response.json({
    received: true,
    matched: true,
    entryId: entry.id,
  });
}
