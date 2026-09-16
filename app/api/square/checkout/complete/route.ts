import {
  createClubhouseEntryRecord,
  getClubhouseEntryRecordBySquareCheckoutId,
} from "@/lib/clubhouse-entry-store";
import { findOrCreateCheckoutEntry } from "@/lib/payment-idempotency";
import {
  getOrStartSquareCheckoutAccess,
  getSquareCheckoutRecord,
  updateSquareCheckoutRecord,
} from "@/lib/square-checkout-store";
import {
  getEventCodeRevealExpiry,
  isEventCodeRevealExpired,
  withoutEventCode,
} from "@/lib/event-code-access";
import {
  verifySquareOrderPayment,
} from "@/lib/square";
import { sendPaymentConfirmationEmails } from "@/lib/payment-confirmation-email";
import { getCurrentVerifiedPlayer, normalizeEmail } from "@/lib/player-auth";
import { recordTransactionAuditEvent } from "@/lib/transaction-audit";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import { activeParticipationHold } from "@/lib/participation-holds";

export const dynamic = "force-dynamic";

async function createEntryResponse(input: {
  checkoutId: string;
  entry: { e6EventCode: string } & Record<string, unknown>;
  revealAccess: boolean;
  blockedReason?: string;
  status?: number;
}) {
  if (!input.revealAccess) {
    return Response.json(
      { entry: withoutEventCode(input.entry), ...(input.blockedReason ? { error: input.blockedReason } : {}) },
      { status: input.blockedReason ? 409 : input.status },
    );
  }

  const accessRevealedAt = await getOrStartSquareCheckoutAccess(input.checkoutId);
  const eventCodeExpiresAt = getEventCodeRevealExpiry(accessRevealedAt).toISOString();
  const eventCodeExpired = isEventCodeRevealExpired(accessRevealedAt);

  return Response.json(
    {
      entry: eventCodeExpired ? withoutEventCode(input.entry) : input.entry,
      eventCodeExpired,
      eventCodeExpiresAt,
    },
    { status: input.status },
  );
}

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

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

  if (["Refund Requested", "Refund Pending", "Refunded"].includes(checkout.refundStatus ?? "")) {
    return Response.json({ error: "This checkout is being refunded. Contact support if you need help." }, { status: 409 });
  }
  const hold = await activeParticipationHold(player.id);
  const blockedReason = hold ? "This entry is under eligibility review. The simulator event code is paused; contact Pin2Win support." : undefined;

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
            eligibilityHeld: Boolean(hold),
            onAudienceSent: async (audience) => {
              await updateSquareCheckoutRecord(checkout.id, {
                [audience === "staff" ? "staffEmailSentAt" : "playerEmailSentAt"]: new Date().toISOString(),
              });
            },
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

      return createEntryResponse({
        checkoutId: checkout.id,
        entry: existingEntry,
        revealAccess: revealAccess && !hold,
        blockedReason,
      });
    }

    if (squareOrderId && squareOrderId !== checkout.squareOrderId) {
      return Response.json(
        { error: "Square order did not match this checkout." },
        { status: 400 },
      );
    }

    const squareVerification = await verifySquareOrderPayment({
      amountCents: checkout.amountCents,
      orderId: checkout.squareOrderId,
    });
    const isConfirmed =
      checkout.status === "Succeeded" ||
      squareVerification.isPaid ||
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
      checkout.status === "Succeeded" && (checkout.squarePaidAt || !squareVerification.paymentCreatedAt)
        ? checkout
        : await updateSquareCheckoutRecord(checkout.id, {
            squarePaymentId:
              squareVerification.paymentId || checkout.squarePaymentId,
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
          eligibilityHeld: Boolean(hold),
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

      return createEntryResponse({
        checkoutId: checkout.id,
        entry,
        revealAccess: revealAccess && !hold,
        blockedReason,
        status: 201,
    });
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
