import type { ClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";
import { getClubhouseChallenge } from "@/lib/clubhouse";
import type { PayarcCheckoutRecord } from "@/lib/payarc-checkout-store";
import type { SquareCheckoutRecord } from "@/lib/square-checkout-store";

const pin2WinNotificationEmail =
  process.env.PIN2WIN_PAYMENT_NOTIFICATION_EMAIL ?? "pin2wingolf@outlook.com";

function getAppBaseUrl(request?: Request) {
  const configuredUrl =
    process.env.PIN2WIN_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL;

  if (configuredUrl) {
    return configuredUrl.startsWith("http")
      ? configuredUrl
      : `https://${configuredUrl}`;
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

export async function sendPaymentConfirmationEmails(input: {
  checkout: PayarcCheckoutRecord | SquareCheckoutRecord;
  entry: ClubhouseEntryRecord;
  request?: Request;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;
  const challenge = getClubhouseChallenge(input.entry.challengeSlug);
  const entryUrl = `${getAppBaseUrl(input.request)}/entry/${input.entry.id}`;
  const recipients = Array.from(
    new Set([input.checkout.playerEmail, pin2WinNotificationEmail]),
  );
  const subject = `Pin2Win entry confirmed - ${input.entry.id}`;
  const text = [
    `Hi ${input.entry.playerName},`,
    "",
    "Your Pin2Win payment has been verified and your challenge entry is ready.",
    "",
    `Entry ID: ${input.entry.id}`,
    `Challenge: ${challenge?.name ?? input.entry.challengeSlug}`,
    `Location: ${input.entry.locationName}`,
    `Bay: ${input.entry.bayName}`,
    `Simulator account name: ${input.entry.e6DisplayName}`,
    `Payment amount: ${formatCurrency(input.entry.amountCents ?? input.checkout.amountCents)}`,
    `Payment provider: ${input.entry.paymentMethod}`,
    `Payment reference: ${
      "squareOrderId" in input.checkout
        ? input.checkout.squareOrderId
        : input.checkout.payarcOrderId
    }`,
    `Valid until: ${input.entry.validUntil}`,
    "",
    "Simulator event code:",
    input.entry.e6EventCode,
    "",
    "Open your entry:",
    entryUrl,
    "",
    "Thank you for playing Pin2Win.",
  ].join("\n");

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
      throw new Error("Payment confirmation email could not be sent.");
    }

    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Payment confirmation email delivery is not configured.");
  }

  console.info(`Pin2Win payment confirmation email to ${recipients.join(", ")}:\n${text}`);
}
