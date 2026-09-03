import {
  createClubhouseEntryRecord,
  getClubhouseEntryRecordBySquareCheckoutId,
} from "@/lib/clubhouse-entry-store";
import { findOrCreateCheckoutEntry } from "@/lib/payment-idempotency";
import {
  claimSquareCheckoutAccess,
  getSquareCheckoutRecord,
  updateSquareCheckoutRecord,
} from "@/lib/square-checkout-store";
import {
  getSquareOrder,
  squareOrderLooksPaid,
} from "@/lib/square";
import { sendPaymentConfirmationEmails } from "@/lib/payment-confirmation-email";
import { getCurrentVerifiedPlayer, normalizeEmail } from "@/lib/player-auth";
import { recordTransactionAuditEvent } from "@/lib/transaction-audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { player, error, status } = await getCurrentVerifiedPlayer();

  if (error || !player) {
    return Response.json({ error }, { status });
  }

  const body = (await request.json()) as {
    checkoutId?: unknown;
    revealAccess?: unknown;
    squareOrderId?: unknown;
    squarePaymentId?: unknown;
  };
  const checkoutId =
    typeof body.checkoutId === "string" ? body.checkoutId.trim() : "";
  const squareOrderId =
    typeof body.squareOrderId === "string" ? body.squareOrderId.trim() : "";
  const revealAccess = body.revealAccess === true;

  if (!checkoutId) {
    return Response.json({ error: "Checkout ID is required." }, { status: 400 });
  }

  const checkout = await getSquareCheckoutRecord(checkoutId);

  if (!checkout) {
    return Response.json({ error: "Checkout was not found." }, { status: 404 });
  }

  if (normalizeEmail(checkout.playerEmail) !== normalizeEmail(player.email)) {
    return Response.json(
      { error: "This checkout belongs to a different player account." },
      { status: 403 },
    );
  }

  try {
    const existingEntry = await getClubhouseEntryRecordBySquareCheckoutId(
      checkout.id,
    );

    if (existingEntry) {
      if (!checkout.confirmationEmailSentAt) {
        try {
          await sendPaymentConfirmationEmails({
            checkout,
            entry: existingEntry,
            request,
          });
          await updateSquareCheckoutRecord(checkout.id, {
            confirmationEmailSentAt: new Date().toISOString(),
          });
          await recordTransactionAuditEvent({
            checkoutId: checkout.id,
            provider: "square",
            event: "confirmation_emails_sent",
            status: "Succeeded",
            meta: { entryId: existingEntry.id },
          });
        } catch (emailError) {
          await recordTransactionAuditEvent({
            checkoutId: checkout.id,
            provider: "square",
            event: "confirmation_emails_failed",
            status: "Failed",
            meta: { entryId: existingEntry.id },
          });
          console.error("Checkout completed but confirmation email failed.", emailError);
        }
      }

      if (revealAccess && checkout.accessRevealedAt) {
        return Response.json(
          { error: "This event code has already been revealed. Please pay again to play again." },
          { status: 409 },
        );
      }

      if (revealAccess && !(await claimSquareCheckoutAccess(checkout.id))) {
        return Response.json(
          { error: "This event code has already been revealed. Please pay again to play again." },
          { status: 409 },
        );
      }

      return Response.json({ entry: existingEntry });
    }

    if (squareOrderId && squareOrderId !== checkout.squareOrderId) {
      return Response.json(
        { error: "Square order did not match this checkout." },
        { status: 400 },
      );
    }

    const squareOrder = await getSquareOrder({ orderId: checkout.squareOrderId });
    const isConfirmed =
      checkout.status === "Succeeded" ||
      squareOrderLooksPaid(squareOrder, checkout.amountCents) ||
      (process.env.NODE_ENV !== "production" &&
        process.env.SQUARE_ALLOW_CLIENT_COMPLETION === "true");

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
      } catch (emailError) {
        await recordTransactionAuditEvent({
          checkoutId: updatedCheckout.id,
          provider: "square",
          event: "confirmation_emails_failed",
          status: "Failed",
          meta: { entryId: entry.id },
        });
        console.error("Checkout completed but confirmation email failed.", emailError);
      }
    }

    if (revealAccess && !(await claimSquareCheckoutAccess(checkout.id))) {
      return Response.json(
        {
          error:
            "This event code has already been revealed. Please pay again to play again.",
        },
        { status: 409 },
      );
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
