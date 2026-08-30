import {
  createClubhouseEntryRecord,
  getClubhouseEntryRecordBySquareCheckoutId,
} from "@/lib/clubhouse-entry-store";
import { findOrCreateCheckoutEntry } from "@/lib/payment-idempotency";
import {
  getSquareCheckoutRecord,
  updateSquareCheckoutRecord,
} from "@/lib/square-checkout-store";
import {
  getSquareOrder,
  getSquarePayment,
  squareOrderLooksPaid,
  squarePaymentLooksPaid,
} from "@/lib/square";
import { sendPaymentConfirmationEmails } from "@/lib/payment-confirmation-email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    checkoutId?: unknown;
    squareOrderId?: unknown;
    squarePaymentId?: unknown;
  };
  const checkoutId =
    typeof body.checkoutId === "string" ? body.checkoutId.trim() : "";
  const squareOrderId =
    typeof body.squareOrderId === "string" ? body.squareOrderId.trim() : "";
  const squarePaymentId =
    typeof body.squarePaymentId === "string" ? body.squarePaymentId.trim() : "";

  if (!checkoutId) {
    return Response.json({ error: "Checkout ID is required." }, { status: 400 });
  }

  const checkout = await getSquareCheckoutRecord(checkoutId);

  if (!checkout) {
    return Response.json({ error: "Checkout was not found." }, { status: 404 });
  }

  try {
    const existingEntry = await getClubhouseEntryRecordBySquareCheckoutId(
      checkout.id,
    );

    if (existingEntry) {
      return Response.json({ entry: existingEntry });
    }

    if (squareOrderId && squareOrderId !== checkout.squareOrderId) {
      return Response.json(
        { error: "Square order did not match this checkout." },
        { status: 400 },
      );
    }

    const squarePayment = squarePaymentId
      ? await getSquarePayment({ paymentId: squarePaymentId })
      : null;
    const squareOrder = await getSquareOrder({ orderId: checkout.squareOrderId });
    const isConfirmed =
      checkout.status === "Succeeded" ||
      squarePaymentLooksPaid(squarePayment) ||
      squareOrderLooksPaid(squareOrder) ||
      process.env.SQUARE_ALLOW_CLIENT_COMPLETION === "true";

    if (!isConfirmed) {
      return Response.json(
        {
          error:
            "Square payment is still being confirmed. Please wait a moment and try again.",
        },
        { status: 409 },
      );
    }

    const updatedCheckout =
      checkout.status === "Succeeded"
        ? checkout
        : await updateSquareCheckoutRecord(checkout.id, {
            squarePaymentId: squarePaymentId || checkout.squarePaymentId,
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

    return Response.json({ entry }, { status: 201 });
  } catch (caughtError) {
    return Response.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Could not complete Square checkout.",
      },
      { status: 400 },
    );
  }
}
