import { createHmac, timingSafeEqual } from "node:crypto";
import { createBookingVerificationRecord } from "@/lib/booking-verification-store";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function firstCleanText(values: unknown[], maxLength = 1000) {
  for (const value of values) {
    const text = cleanText(value, maxLength);

    if (text) {
      return text;
    }
  }

  return "";
}

function extractEmail(value: string) {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function cleanCustomerEmail(value: string) {
  const email = extractEmail(value);

  return /pin2wingolf@outlook\.com/i.test(email) ? "" : email;
}

function missingCustomerEmail() {
  return `missing-booking-email-${Date.now()}@pin2wingolf.local`;
}

function normalizeKnownLocationName(value: string) {
  return /alamo\s+golf\s+den/i.test(value) ? "Alamo Golf Den" : value;
}

function normalizeKnownLocationSlug(value: string) {
  return /alamo\s+golf\s+den/i.test(value) ? "alamo-golf-den" : "";
}

function cleanBayName(value: string) {
  const normalized = value.trim();

  return /^bay\s+\d+/i.test(normalized) ? normalized : "";
}

function parseCentralBookingDate(input: string) {
  const match = input.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*(CDT|CST)?/i,
  );

  if (!match) {
    return "";
  }

  const [, month, day, year, hourInput, minute, meridiem, timezone] = match;
  let hour = Number(hourInput);

  if (meridiem.toUpperCase() === "PM" && hour !== 12) {
    hour += 12;
  }

  if (meridiem.toUpperCase() === "AM" && hour === 12) {
    hour = 0;
  }

  const offset = timezone?.toUpperCase() === "CST" ? "-06:00" : "-05:00";

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${String(
    hour,
  ).padStart(2, "0")}:${minute}:00${offset}`;
}

function addMinutesToIso(value: string, minutes: number) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() + minutes * 60 * 1000).toISOString();
}

function parseGolf918Email(rawEmailText: string) {
  const normalized = rawEmailText.replace(/\r/g, "");
  const greetingMatch = normalized.match(/\bHi\s+([^,\n]+),/i);
  const locationMatch =
    normalized.match(/\*\*([^*\n]+(?:LLC|Golf Den)[^*\n]*)\*\*/i) ??
    normalized.match(/^\s*([^\n]*(?:LLC|Golf Den)[^\n]*)\s*$/im);
  const bayMatch = normalized.match(
    /\*\*(Bay\s*[^:*]+):\*\*\s*([^\n]+?)(?:\n|$)/i,
  );
  const plainBayMatch = normalized.match(/\b(Bay\s*[^:]+):\s*([^\n]+)/i);
  const bookingLine = bayMatch?.[2] ?? plainBayMatch?.[2] ?? "";
  const bayName = bayMatch?.[1] ?? plainBayMatch?.[1] ?? "";
  const durationMatch = bookingLine.match(/for\s+(\d+)\s+minutes?/i);
  const reservationStartsAt = parseCentralBookingDate(bookingLine);
  const durationMinutes = durationMatch ? Number(durationMatch[1]) : 0;

  return {
    bayName: bayName.trim(),
    customerName: greetingMatch?.[1]?.trim() ?? "",
    durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : 0,
    locationName: locationMatch?.[1]?.trim() ?? "",
    reservationEndsAt:
      reservationStartsAt && durationMinutes
        ? addMinutesToIso(reservationStartsAt, durationMinutes)
        : "",
    reservationStartsAt,
  };
}

function htmlToText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function webhookSecretBytes(secret: string) {
  const value = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;

  return Buffer.from(value, "base64");
}

function isValidResendSignature(payload: string, request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signatureHeader = request.headers.get("svix-signature");

  if (!id || !timestamp || !signatureHeader) {
    return false;
  }

  const signedPayload = `${id}.${timestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", webhookSecretBytes(webhookSecret))
    .update(signedPayload)
    .digest();

  return signatureHeader.split(" ").some((signature) => {
    const [, value] = signature.split(",");

    if (!value) {
      return false;
    }

    const receivedSignature = Buffer.from(value, "base64");

    return (
      receivedSignature.length === expectedSignature.length &&
      timingSafeEqual(receivedSignature, expectedSignature)
    );
  });
}

async function getReceivedEmail(emailId: string) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is required to retrieve inbound email content.");
  }

  const response = await fetch(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`,
    {
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
      },
    },
  );

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    throw new Error(
      cleanText(body?.message, 500) ||
        `Resend received email lookup failed with HTTP ${response.status}.`,
    );
  }

  if (!body) {
    throw new Error("Resend returned an empty received email response.");
  }

  return body;
}

export async function POST(request: Request) {
  const payload = await request.text();

  if (!isValidResendSignature(payload, request)) {
    return Response.json({ error: "Invalid Resend webhook signature." }, { status: 403 });
  }

  const event = JSON.parse(payload) as {
    type?: string;
    data?: {
      email_id?: string;
      from?: string;
      subject?: string;
      message_id?: string;
      created_at?: string;
      reply_to?: string[];
    };
  };

  if (event.type !== "email.received") {
    return Response.json({ received: true, ignored: true });
  }

  const emailId = cleanText(event.data?.email_id, 120);

  if (!emailId) {
    return Response.json({ error: "Missing Resend email id." }, { status: 400 });
  }

  try {
    const email = await getReceivedEmail(emailId);
    const rawEmailText =
      firstCleanText([email.text, htmlToText(cleanText(email.html, 20000))], 10000) ||
      cleanText(email.subject, 500);
    const parsedEmail = parseGolf918Email(rawEmailText);
    const locationName = normalizeKnownLocationName(
      parsedEmail.locationName || "Alamo Golf Den",
    );
    const booking = await createBookingVerificationRecord({
      customerName: parsedEmail.customerName || "Booking customer",
      customerEmail:
        cleanCustomerEmail(rawEmailText) ||
        cleanCustomerEmail(cleanText(email.from, 320)) ||
        cleanCustomerEmail(firstCleanText([...(email.reply_to as unknown[] ?? [])], 320)) ||
        missingCustomerEmail(),
      locationSlug: normalizeKnownLocationSlug(locationName),
      locationName,
      bayName: cleanBayName(parsedEmail.bayName),
      productName: "Alamo Golf Den Bay Booking",
      reservationStartsAt: parsedEmail.reservationStartsAt,
      reservationEndsAt: parsedEmail.reservationEndsAt,
      source: "Email CC",
      externalReference:
        cleanText(email.message_id, 180) ||
        cleanText(event.data?.message_id, 180) ||
        emailId,
      rawEmailSubject:
        cleanText(email.subject, 500) || cleanText(event.data?.subject, 500),
      rawEmailText,
    });

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not process Resend inbound email.",
      },
      { status: 400 },
    );
  }
}
