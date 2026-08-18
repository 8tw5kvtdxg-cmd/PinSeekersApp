import {
  createClubhouseEntryRecord,
  getClubhouseEntryRecordBySquareCheckoutId,
} from "@/lib/clubhouse-entry-store";
import {
  getSquareCheckoutRecordByOrderId,
  updateSquareCheckoutRecord,
} from "@/lib/square-checkout-store";
import { sendPaymentConfirmationEmails } from "@/lib/payment-confirmation-email";
import { squareOrderLooksPaid } from "@/lib/square";

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
  const payload = (await request.json().catch(() => null)) as unknown;

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
  const existingEntry = await getClubhouseEntryRecordBySquareCheckoutId(
    updatedCheckout.id,
  );

  if (existingEntry) {
    return Response.json({
      received: true,
      matched: true,
      entryId: existingEntry.id,
    });
  }

  const entry = await createClubhouseEntryRecord({
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
    entryId: entry.id,
  });

  await sendPaymentConfirmationEmails({
    checkout: updatedCheckout,
    entry,
    request,
  });
  await updateSquareCheckoutRecord(updatedCheckout.id, {
    confirmationEmailSentAt: new Date().toISOString(),
  });

  return Response.json({
    received: true,
    matched: true,
    entryId: entry.id,
  });
}
