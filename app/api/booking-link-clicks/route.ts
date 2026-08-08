import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const maxFieldLength = 500;

function cleanText(value: unknown, maxLength = maxFieldLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isSafeBookingUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function recordBookingClick({
  bookingUrl,
  locationId,
  locationName,
  locationSlug,
  referrer,
  request,
}: {
  bookingUrl: string;
  locationId: string | null;
  locationName: string;
  locationSlug: string;
  referrer: string;
  request: Request;
}) {
  const prisma = getPrismaClient();

  if (!prisma?.bookingLinkClick) {
    return null;
  }

  return prisma.bookingLinkClick.create({
    data: {
      locationId,
      locationSlug,
      locationName,
      bookingUrl,
      referrer: referrer || null,
      userAgent: cleanText(request.headers.get("user-agent"), 500) || null,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });
}

async function parseClickBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }

  const rawBody = await request.text();

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = await parseClickBody(request);
  const locationSlug = cleanText(body.locationSlug, 120);
  const locationName = cleanText(body.locationName, 180);
  const bookingUrl = cleanText(body.bookingUrl, 1000);

  if (!locationSlug || !locationName || !bookingUrl) {
    return Response.json(
      { error: "Location and booking URL are required." },
      { status: 400 },
    );
  }

  const referrer =
    cleanText(body.referrer, 1000) || cleanText(request.headers.get("referer"), 1000);
  const locationId = cleanText(body.locationId, 120) || null;

  const click = await recordBookingClick({
    bookingUrl,
    locationId,
    locationName,
    locationSlug,
    referrer,
    request,
  });

  if (!click) {
    return Response.json(
      { error: "Booking click logging is not ready." },
      { status: 503 },
    );
  }

  return Response.json({ click }, { status: 201 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bookingUrl = cleanText(url.searchParams.get("bookingUrl"), 1000);
  const locationSlug = cleanText(url.searchParams.get("locationSlug"), 120);
  const locationName = cleanText(url.searchParams.get("locationName"), 180);
  const locationId = cleanText(url.searchParams.get("locationId"), 120) || null;
  const referrer = cleanText(request.headers.get("referer"), 1000);

  if (!bookingUrl || !locationSlug || !locationName || !isSafeBookingUrl(bookingUrl)) {
    return Response.json(
      { error: "Valid location and booking URL are required." },
      { status: 400 },
    );
  }

  await recordBookingClick({
    bookingUrl,
    locationId,
    locationName,
    locationSlug,
    referrer,
    request,
  });

  return Response.redirect(bookingUrl, 302);
}
