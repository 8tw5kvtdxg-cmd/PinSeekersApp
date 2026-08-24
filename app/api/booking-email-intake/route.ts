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

function cleanAmountCents(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[$,\s]/g, "");
    const parsed = Number(normalized);

    if (Number.isFinite(parsed)) {
      return Math.round(parsed * 100);
    }
  }

  return undefined;
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

function isAuthorized(request: Request) {
  const intakeSecret = process.env.BOOKING_EMAIL_INTAKE_SECRET;

  if (!intakeSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization") ?? "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const headerToken = request.headers.get("x-pin2win-intake-secret") ?? "";

  return bearerToken === intakeSecret || headerToken === intakeSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const rawEmailText = firstCleanText(
    [
      body.rawEmailText,
      body.rawText,
      body.raw_email_text,
      body.raw_text,
      body.emailText,
      body.email_text,
      body.body,
      body.Body,
      body.plainBody,
      body.plain_body,
      body.bodyPlain,
      body.body_plain,
      body.bodyPreview,
      body.body_preview,
      body.message,
      body.text,
    ],
    5000,
  );
  const parsedEmail = rawEmailText ? parseGolf918Email(rawEmailText) : null;
  const locationName = normalizeKnownLocationName(
    firstCleanText([body.locationName, body.location_name, body.location], 180) ||
      parsedEmail?.locationName ||
      "Alamo Golf Den",
  );
  const locationSlug =
    firstCleanText([body.locationSlug, body.location_slug], 120) ||
    normalizeKnownLocationSlug(locationName);
  const customerEmail = firstCleanText(
    [
      cleanCustomerEmail(cleanText(body.customerEmail, 320)),
      cleanCustomerEmail(cleanText(body.customer_email, 320)),
      cleanCustomerEmail(cleanText(body.email, 320)),
      cleanCustomerEmail(cleanText(body.Email, 320)),
      cleanCustomerEmail(extractEmail(rawEmailText)),
      cleanCustomerEmail(cleanText(body.replyTo, 320)),
      cleanCustomerEmail(cleanText(body.reply_to, 320)),
      cleanCustomerEmail(cleanText(body.fromEmail, 320)),
      cleanCustomerEmail(cleanText(body.from_email, 320)),
      cleanCustomerEmail(cleanText(body.senderEmail, 320)),
      cleanCustomerEmail(cleanText(body.sender_email, 320)),
    ],
    320,
  );
  const bayName =
    firstCleanText(
      [
        cleanBayName(cleanText(body.bayName, 120)),
        cleanBayName(cleanText(body.bay_name, 120)),
        cleanBayName(cleanText(body.bay, 120)),
        parsedEmail?.bayName,
      ],
      120,
    ) || "";

  try {
    const booking = await createBookingVerificationRecord({
      customerName:
        firstCleanText(
          [
            body.customerName,
            body.customer_name,
            body.name,
            body.Name,
            parsedEmail?.customerName,
          ],
          180,
        ) || "Booking customer",
      customerEmail: customerEmail || missingCustomerEmail(),
      customerPhone: firstCleanText(
        [body.customerPhone, body.customer_phone, body.phone, body.Phone],
        80,
      ),
      locationSlug,
      locationName,
      bayName,
      productName:
        firstCleanText([body.productName, body.product_name, body.product], 180) ||
        "Alamo Golf Den Bay Booking",
      reservationStartsAt:
        firstCleanText(
          [
            body.reservationStartsAt,
            body.reservation_starts_at,
            body.startsAt,
            body.starts_at,
            body.startTime,
            body.start_time,
          ],
          120,
        ) ||
        parsedEmail?.reservationStartsAt ||
        "",
      reservationEndsAt:
        firstCleanText(
          [
            body.reservationEndsAt,
            body.reservation_ends_at,
            body.endsAt,
            body.ends_at,
            body.endTime,
            body.end_time,
          ],
          120,
        ) ||
        parsedEmail?.reservationEndsAt ||
        "",
      amountCents: cleanAmountCents(body.amountCents ?? body.amount),
      source: "Email CC",
      externalReference: firstCleanText(
        [body.externalReference, body.external_reference, body.id],
        180,
      ),
      rawEmailSubject: firstCleanText(
        [body.rawEmailSubject, body.raw_email_subject, body.subject, body.Subject],
        500,
      ),
      rawEmailText,
    });

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create booking from email.",
      },
      { status: 400 },
    );
  }
}
