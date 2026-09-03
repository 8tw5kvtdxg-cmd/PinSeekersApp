import { getAppBaseUrl } from "@/lib/app-url";
import type { BookingVerificationRecord } from "@/lib/booking-verification-store";
import { getPin2WinNotificationEmails } from "@/lib/notification-email-recipients";

export async function sendQrScanNotification(input: {
  bayName?: string;
  booking?: BookingVerificationRecord | null;
  challengeName: string;
  locationSlug: string;
  request?: Request;
  scanUrl: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;
  const notificationEmails = getPin2WinNotificationEmails();
  const matched = Boolean(input.booking);
  const subject = matched
    ? `Pin2Win QR scan matched active booking - ${input.locationSlug}`
    : `Pin2Win QR scan needs booking review - ${input.locationSlug}`;
  const text = [
    matched
      ? "A customer scanned a Pin2Win QR code during a likely active partner booking window."
      : "A customer scanned a Pin2Win QR code, but no matching active booking window was found.",
    "",
    `Challenge: ${input.challengeName}`,
    `Location: ${input.locationSlug}`,
    `Bay: ${input.bayName || "Not specified"}`,
    `Scan URL: ${input.scanUrl}`,
    "",
    input.booking ? `Booking ID: ${input.booking.id}` : "",
    input.booking ? `Customer: ${input.booking.customerName}` : "",
    input.booking ? `Booking email: ${input.booking.customerEmail}` : "",
    input.booking ? `Product: ${input.booking.productName}` : "",
    input.booking ? `Reservation start: ${input.booking.reservationStartsAt}` : "",
    input.booking?.reservationEndsAt
      ? `Reservation end: ${input.booking.reservationEndsAt}`
      : "",
    "",
    "Admin booking queue:",
    `${getAppBaseUrl(input.request)}/admin/bookings`,
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
        to: notificationEmails,
        subject,
        text,
      }),
    });

    if (!response.ok && process.env.NODE_ENV === "production") {
      throw new Error("QR scan notification email could not be sent.");
    }

    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("QR scan notification email delivery is not configured.");
  }

  console.info(
    `Pin2Win QR scan notification to ${notificationEmails.join(", ")}:\n${text}`,
  );
}
