import { getAppBaseUrl } from "./app-url.ts";
import type { ClubhouseEntryRecord } from "./clubhouse-entry-store.ts";
import { getClubhouseChallenge } from "./clubhouse.ts";
import { getPin2WinNotificationEmails } from "./notification-email-recipients.ts";
import type { PayarcCheckoutRecord } from "./payarc-checkout-store.ts";
import type { SquareCheckoutRecord } from "./square-checkout-store.ts";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

async function sendResendEmail(input: {
  apiKey: string;
  from: string;
  idempotencyKey: string;
  subject: string;
  tags: Array<{ name: string; value: string }>;
  text: string;
  to: string[];
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      tags: input.tags,
    }),
  });

  if (!response.ok) {
    const responseBody = (await response.json().catch(() => null)) as {
      message?: unknown;
    } | null;
    const detail =
      typeof responseBody?.message === "string"
        ? responseBody.message
        : `HTTP ${response.status}`;

    console.error(`Resend payment email failed: ${detail}`);
    throw new Error("Payment confirmation email could not be sent.");
  }

  return (await response.json().catch(() => null)) as { id?: string } | null;
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
  const notificationEmails = getPin2WinNotificationEmails();
  const amount = formatCurrency(
    input.entry.amountCents ?? input.checkout.amountCents,
  );
  const paymentReference =
    "squareOrderId" in input.checkout
      ? input.checkout.squareOrderId
      : input.checkout.payarcOrderId;
  const playerSubject = `Pin2Win entry confirmed - ${input.entry.id}`;
  const playerText = [
    `Hi ${input.entry.playerName},`,
    "",
    "Your Pin2Win payment has been verified and your challenge entry is ready.",
    "",
    `Entry ID: ${input.entry.id}`,
    `Challenge: ${challenge?.name ?? input.entry.challengeSlug}`,
    `Location: ${input.entry.locationName}`,
    `Bay: ${input.entry.bayName}`,
    `Simulator account name: ${input.entry.e6DisplayName}`,
    `Payment amount: ${amount}`,
    `Payment provider: ${input.entry.paymentMethod}`,
    `Payment reference: ${paymentReference}`,
    `Valid until: ${input.entry.validUntil}`,
    "",
    "Open your entry:",
    entryUrl,
    "",
    "For entry protection, the simulator event code is shown only on the payment-confirmed access page and hides 10 minutes after it is first revealed.",
    "",
    "Thank you for playing Pin2Win.",
  ].join("\n");
  const staffSubject = `Payment received: ${amount} - ${input.entry.playerName}`;
  const staffText = [
    "A Pin2Win challenge payment was confirmed.",
    "",
    `Player: ${input.entry.playerName}`,
    `Player email: ${input.checkout.playerEmail}`,
    `Phone: ${input.entry.phoneNumber ?? "Not provided"}`,
    `Entry ID: ${input.entry.id}`,
    `Challenge: ${challenge?.name ?? input.entry.challengeSlug}`,
    `Location: ${input.entry.locationName}`,
    `Bay: ${input.entry.bayName ?? "Not specified"}`,
    `Simulator account: ${input.entry.e6DisplayName}`,
    `Amount: ${amount}`,
    `Provider: ${input.entry.paymentMethod}`,
    `Payment reference: ${paymentReference}`,
    "",
    `Open entry: ${entryUrl}`,
  ].join("\n");

  if (resendApiKey && from) {
    const staffEmail = await sendResendEmail({
      apiKey: resendApiKey,
      from,
      idempotencyKey: `payment-notification-staff/${input.entry.id}`,
      subject: staffSubject,
      tags: [
        { name: "category", value: "payment-notification" },
        { name: "audience", value: "staff" },
      ],
      text: staffText,
      to: notificationEmails,
    });
    const playerEmail = await sendResendEmail({
      apiKey: resendApiKey,
      from,
      idempotencyKey: `payment-confirmation-player/${input.entry.id}`,
      subject: playerSubject,
      tags: [
        { name: "category", value: "payment-confirmation" },
        { name: "audience", value: "player" },
      ],
      text: playerText,
      to: [input.checkout.playerEmail],
    });

    return {
      playerEmailId: playerEmail?.id,
      staffEmailId: staffEmail?.id,
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Payment confirmation email delivery is not configured.");
  }

  console.info(
    `Pin2Win staff payment notification to ${notificationEmails.join(", ")}:\n${staffText}`,
  );
  console.info(
    `Pin2Win player payment confirmation to ${input.checkout.playerEmail}:\n${playerText}`,
  );
}
