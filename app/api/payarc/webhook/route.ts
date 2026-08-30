import {
  createClubhouseEntryRecord,
  getClubhouseEntryRecordByPayarcCheckoutId,
} from "@/lib/clubhouse-entry-store";
import { findOrCreateCheckoutEntry } from "@/lib/payment-idempotency";
import { isLegacyPayarcEnabled } from "@/lib/payment-provider";
import {
  listPayarcCheckoutRecords,
  updatePayarcCheckoutRecord,
} from "@/lib/payarc-checkout-store";
import { sendPaymentConfirmationEmails } from "@/lib/payment-confirmation-email";

export const dynamic = "force-dynamic";

function payloadTextIncludes(payload: unknown, value: string) {
  return JSON.stringify(payload).includes(value);
}

function readNestedString(payload: unknown, fields: string[]) {
  let current = payload;

  for (const field of fields) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return "";
    }

    current = (current as Record<string, unknown>)[field];
  }

  return typeof current === "string" ? current : "";
}

function webhookLooksSuccessful(payload: unknown) {
  const text = JSON.stringify(payload).toLowerCase();

  return (
    text.includes("success") ||
    text.includes("submitted_for_settlement") ||
    text.includes("captured")
  );
}

export async function POST(request: Request) {
  if (!isLegacyPayarcEnabled()) {
    return Response.json(
      {
        error: "Payarc webhooks are disabled for this deployment.",
      },
      { status: 410 },
    );
  }

  const payload = (await request.json().catch(() => null)) as unknown;

  if (!payload) {
    return Response.json({ received: false }, { status: 400 });
  }

  const checkouts = await listPayarcCheckoutRecords();
  const checkout = checkouts.find(
    (record) =>
      payloadTextIncludes(payload, record.id) ||
      payloadTextIncludes(payload, record.payarcOrderId),
  );

  if (!checkout) {
    return Response.json({ received: true, matched: false });
  }

  if (!webhookLooksSuccessful(payload)) {
    await updatePayarcCheckoutRecord(checkout.id, { status: "Failed" });

    return Response.json({ received: true, matched: true, status: "Failed" });
  }

  const chargeId =
    readNestedString(payload, [
      "api_response",
      "original",
      "data",
      "id",
    ]) || readNestedString(payload, ["data", "id"]);
  const updatedCheckout = await updatePayarcCheckoutRecord(checkout.id, {
    status: "Succeeded",
    payarcChargeId: chargeId || undefined,
  });

  if (!updatedCheckout) {
    return Response.json({ received: true, matched: false });
  }

  const entry = await findOrCreateCheckoutEntry({
    findExisting: async () =>
      await getClubhouseEntryRecordByPayarcCheckoutId(updatedCheckout.id),
    createEntry: async () => {
      const createdEntry = await createClubhouseEntryRecord({
        challengeSlug: updatedCheckout.challengeSlug,
        playerName: updatedCheckout.playerName,
        playerEmail: updatedCheckout.playerEmail,
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
        entryId: createdEntry.id,
      });

      return createdEntry;
    },
    recoverExisting: async () =>
      await getClubhouseEntryRecordByPayarcCheckoutId(updatedCheckout.id),
  });

  if (!updatedCheckout.confirmationEmailSentAt) {
    await sendPaymentConfirmationEmails({
      checkout: updatedCheckout,
      entry,
      request,
    });
    await updatePayarcCheckoutRecord(updatedCheckout.id, {
      confirmationEmailSentAt: new Date().toISOString(),
    });
  }

  return Response.json({
    received: true,
    matched: true,
    entryId: entry.id,
  });
}
