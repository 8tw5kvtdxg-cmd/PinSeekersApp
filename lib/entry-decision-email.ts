import { getAppBaseUrl } from "@/lib/app-url";
import type { ClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";
import { getClubhouseChallenge } from "@/lib/clubhouse";
import { getBookingVerificationRecord } from "@/lib/booking-verification-store";
import { getPayarcCheckoutRecord } from "@/lib/payarc-checkout-store";

const pin2WinNotificationEmail =
  process.env.PIN2WIN_PAYMENT_NOTIFICATION_EMAIL ?? "pin2wingolf@outlook.com";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

export async function getEntryDecisionRecipientEmail(
  entry: ClubhouseEntryRecord,
) {
  if (entry.playerEmail) {
    return entry.playerEmail;
  }

  if (entry.bookingVerificationId) {
    const booking = await getBookingVerificationRecord(entry.bookingVerificationId);

    if (booking?.customerEmail) {
      return booking.customerEmail;
    }
  }

  if (entry.payarcCheckoutId) {
    const checkout = await getPayarcCheckoutRecord(entry.payarcCheckoutId);

    if (checkout?.playerEmail) {
      return checkout.playerEmail;
    }
  }

  return "";
}

export async function sendEntryDecisionEmails(input: {
  entry: ClubhouseEntryRecord;
  decisionStatus: "Confirmed" | "Denied";
  entrantEmail?: string;
  request?: Request;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;
  const challenge = getClubhouseChallenge(input.entry.challengeSlug);
  const entrantEmail =
    input.entrantEmail || (await getEntryDecisionRecipientEmail(input.entry));
  const recipients = Array.from(
    new Set([entrantEmail, pin2WinNotificationEmail].filter(Boolean)),
  );

  if (!entrantEmail) {
    throw new Error("No entrant email is available for this entry.");
  }

  const isConfirmed = input.decisionStatus === "Confirmed";
  const entryUrl = `${getAppBaseUrl(input.request)}/entry/${input.entry.id}`;
  const subject = `Pin2Win entry ${isConfirmed ? "confirmed" : "denied"} - ${
    input.entry.id
  }`;
  const text = [
    `Hi ${input.entry.playerName},`,
    "",
    isConfirmed
      ? "Your Pin2Win challenge entry has been confirmed by the admin team."
      : "Your Pin2Win challenge entry has been denied by the admin team.",
    "",
    `Entry ID: ${input.entry.id}`,
    `Challenge: ${challenge?.name ?? input.entry.challengeSlug}`,
    `Location: ${input.entry.locationName}`,
    `Bay: ${input.entry.bayName ?? "Any bay"}`,
    `Simulator account name: ${input.entry.e6DisplayName}`,
    `Entry amount: ${formatCurrency(input.entry.amountCents)}`,
    `Decision: ${input.decisionStatus}`,
    input.entry.entryDecisionAt
      ? `Decision time: ${input.entry.entryDecisionAt}`
      : "",
    "",
    isConfirmed
      ? "Keep your confirmation page available while you complete the challenge."
      : "If you believe this was an error, reply to this email so Pin2Win can review the entry.",
    "",
    "Entry page:",
    entryUrl,
    "",
    "Pin2Win",
  ]
    .filter((line) => line !== "")
    .join("\n");

  if (resendApiKey && from) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");

      throw new Error(
        [
          "Entry decision email could not be sent.",
          `Resend status: ${response.status}`,
          errorText ? `Resend response: ${errorText}` : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
    }

    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Entry decision email delivery is not configured.");
  }

  console.info(`Pin2Win entry decision email to ${recipients.join(", ")}:\n${text}`);
}
