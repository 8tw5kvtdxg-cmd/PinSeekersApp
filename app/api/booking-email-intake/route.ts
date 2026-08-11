import { createBookingVerificationRecord } from "@/lib/booking-verification-store";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
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
  const locationMatch = normalized.match(/\*\*([^*\n]+(?:LLC|Golf Den)[^*\n]*)\*\*/i);
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
  const rawEmailText = cleanText(
    body.rawEmailText ?? body.body ?? body.bodyPreview,
    5000,
  );
  const parsedEmail = rawEmailText ? parseGolf918Email(rawEmailText) : null;
  const customerEmail =
    cleanText(body.customerEmail, 320) ||
    cleanText(body.toEmail, 320) ||
    cleanText(body.recipientEmail, 320);

  try {
    const booking = await createBookingVerificationRecord({
      customerName:
        cleanText(body.customerName, 180) || parsedEmail?.customerName || "",
      customerEmail,
      customerPhone: cleanText(body.customerPhone, 80),
      locationSlug: cleanText(body.locationSlug, 120),
      locationName:
        cleanText(body.locationName, 180) ||
        parsedEmail?.locationName ||
        "Alamo Golf Den",
      bayName: cleanText(body.bayName, 120) || parsedEmail?.bayName || "",
      productName:
        cleanText(body.productName, 180) || "Alamo Golf Den Bay Booking",
      reservationStartsAt:
        cleanText(body.reservationStartsAt, 120) ||
        parsedEmail?.reservationStartsAt ||
        "",
      reservationEndsAt:
        cleanText(body.reservationEndsAt, 120) ||
        parsedEmail?.reservationEndsAt ||
        "",
      amountCents: cleanAmountCents(body.amountCents ?? body.amount),
      source: "Email CC",
      externalReference: cleanText(body.externalReference, 180),
      rawEmailSubject: cleanText(body.rawEmailSubject, 500),
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
