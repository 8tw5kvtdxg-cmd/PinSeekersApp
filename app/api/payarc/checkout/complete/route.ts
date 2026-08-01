import {
  createClubhouseEntryRecord,
  getClubhouseEntryRecordByPayarcCheckoutId,
} from "@/lib/clubhouse-entry-store";
import {
  getPayarcCheckoutRecord,
  updatePayarcCheckoutRecord,
} from "@/lib/payarc-checkout-store";
import { verifyPayarcOrderSucceeded } from "@/lib/payarc";
import { sendPaymentConfirmationEmails } from "@/lib/payment-confirmation-email";
import { getCurrentVerifiedPlayer, normalizeEmail } from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { player, error, status } = await getCurrentVerifiedPlayer();

  if (error || !player) {
    return Response.json({ error }, { status });
  }

  const body = (await request.json()) as {
    checkoutId?: unknown;
  };
  const checkoutId =
    typeof body.checkoutId === "string" ? body.checkoutId.trim() : "";

  if (!checkoutId) {
    return Response.json({ error: "Checkout ID is required." }, { status: 400 });
  }

  const checkout = await getPayarcCheckoutRecord(checkoutId);

  if (!checkout) {
    return Response.json({ error: "Checkout was not found." }, { status: 404 });
  }

  if (normalizeEmail(player.email) !== normalizeEmail(checkout.playerEmail)) {
    return Response.json(
      { error: "Login with the same email used for checkout." },
      { status: 403 },
    );
  }

  try {
    const existingEntry = await getClubhouseEntryRecordByPayarcCheckoutId(
      checkout.id,
    );

    if (existingEntry) {
      if (!checkout.confirmationEmailSentAt) {
        await sendPaymentConfirmationEmails({
          checkout,
          entry: existingEntry,
          request,
        });
        await updatePayarcCheckoutRecord(checkout.id, {
          confirmationEmailSentAt: new Date().toISOString(),
        });
      }

      return Response.json({ entry: existingEntry });
    }

    const isConfirmed =
      checkout.status === "Succeeded" ||
      (await verifyPayarcOrderSucceeded({
        orderName: checkout.id,
        amountCents: checkout.amountCents,
      }));
    const allowClientCompletion =
      process.env.PAYARC_ALLOW_CLIENT_COMPLETION === "true" ||
      process.env.NODE_ENV !== "production";

    if (!isConfirmed && !allowClientCompletion) {
      return Response.json(
        {
          error:
            "Payment is still being confirmed. Please wait a moment and try again.",
        },
        { status: 409 },
      );
    }

    const updatedCheckout =
      checkout.status === "Succeeded"
        ? checkout
        : await updatePayarcCheckoutRecord(checkout.id, {
            status: "Succeeded",
          });

    if (!updatedCheckout) {
      throw new Error("Checkout could not be updated.");
    }

    const entry = await createClubhouseEntryRecord({
      challengeSlug: updatedCheckout.challengeSlug,
      playerName: updatedCheckout.playerName,
      phoneNumber: updatedCheckout.phoneNumber,
      e6DisplayName: updatedCheckout.e6DisplayName,
      payarcCheckoutId: updatedCheckout.id,
      payarcOrderId: updatedCheckout.payarcOrderId,
      venueBookingReference: `Payarc order ${updatedCheckout.payarcOrderId}`,
      locationSlug: updatedCheckout.locationSlug,
      locationName: updatedCheckout.locationName,
      bayName: updatedCheckout.bayName,
    });

    await updatePayarcCheckoutRecord(updatedCheckout.id, {
      entryId: entry.id,
    });

    await sendPaymentConfirmationEmails({
      checkout: updatedCheckout,
      entry,
      request,
    });
    await updatePayarcCheckoutRecord(updatedCheckout.id, {
      confirmationEmailSentAt: new Date().toISOString(),
    });

    return Response.json({ entry }, { status: 201 });
  } catch (caughtError) {
    return Response.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Could not complete Payarc checkout.",
      },
      { status: 400 },
    );
  }
}
