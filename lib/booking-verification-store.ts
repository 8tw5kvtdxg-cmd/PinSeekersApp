import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { slugifyLocation } from "@/lib/location-utils";
import { normalizeEmail } from "@/lib/player-auth";
import { getPrismaClient } from "@/lib/prisma";

export type BookingVerificationStatus =
  | "Pending Match"
  | "Auto Verified"
  | "Needs Review"
  | "Used"
  | "Rejected";

export type BookingVerificationRecord = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  locationSlug: string;
  locationName: string;
  bayName?: string;
  productName: string;
  reservationStartsAt: string;
  reservationEndsAt?: string;
  amountCents?: number;
  source: "Email CC" | "Manual" | "Import";
  externalReference?: string;
  rawEmailSubject?: string;
  rawEmailText?: string;
  status: BookingVerificationStatus;
  matchedEntryId?: string;
  usedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicBookingMatch = {
  id: string;
  maskedName: string;
  maskedEmail: string;
  locationName: string;
  bayName?: string;
  productName: string;
  reservationLabel: string;
  status: BookingVerificationStatus;
};

const bookingsPath = path.join(
  process.cwd(),
  ".pin2win-booking-verifications.json",
);

async function readBookingsMap() {
  try {
    const file = await readFile(bookingsPath, "utf8");
    const parsed = JSON.parse(file) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {} as Record<string, BookingVerificationRecord>;
    }

    return parsed as Record<string, BookingVerificationRecord>;
  } catch {
    return {} as Record<string, BookingVerificationRecord>;
  }
}

async function writeBookingsMap(
  bookings: Record<string, BookingVerificationRecord>,
) {
  await writeFile(bookingsPath, `${JSON.stringify(bookings, null, 2)}\n`);
}

function bookingId(sequence: number, now: Date) {
  const dateKey = now.toISOString().slice(0, 10).replaceAll("-", "");

  return `P2W-BOOKING-${dateKey}-${String(sequence).padStart(4, "0")}`;
}

function nextBookingId(bookings: Array<{ id: string }>, now: Date) {
  const prefix = `P2W-BOOKING-${now.toISOString().slice(0, 10).replaceAll("-", "")}-`;
  const currentMax = bookings.reduce((max, booking) => {
    if (!booking.id.startsWith(prefix)) {
      return max;
    }

    const sequence = Number(booking.id.slice(prefix.length));

    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);

  return bookingId(currentMax + 1, now);
}

function parseDate(value: string) {
  const date = new Date(value);

  return Number.isFinite(date.getTime()) ? date : null;
}

function requiredDate(value: string, label: string) {
  const date = parseDate(value);

  if (!date) {
    throw new Error(`${label} must be a valid date/time.`);
  }

  return date;
}

function optionalDate(value?: string) {
  if (!value) {
    return undefined;
  }

  return parseDate(value) ?? undefined;
}

function toBookingRecord(booking: {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  locationSlug: string;
  locationName: string;
  bayName: string | null;
  productName: string;
  reservationStartsAt: Date;
  reservationEndsAt: Date | null;
  amountCents: number | null;
  source: string;
  externalReference: string | null;
  rawEmailSubject: string | null;
  rawEmailText: string | null;
  status: string;
  matchedEntryId: string | null;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): BookingVerificationRecord {
  return {
    id: booking.id,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone ?? undefined,
    locationSlug: booking.locationSlug,
    locationName: booking.locationName,
    bayName: booking.bayName ?? undefined,
    productName: booking.productName,
    reservationStartsAt: booking.reservationStartsAt.toISOString(),
    reservationEndsAt: booking.reservationEndsAt?.toISOString(),
    amountCents: booking.amountCents ?? undefined,
    source: booking.source as BookingVerificationRecord["source"],
    externalReference: booking.externalReference ?? undefined,
    rawEmailSubject: booking.rawEmailSubject ?? undefined,
    rawEmailText: booking.rawEmailText ?? undefined,
    status: booking.status as BookingVerificationStatus,
    matchedEntryId: booking.matchedEntryId ?? undefined,
    usedAt: booking.usedAt?.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

function reservationLabel(startsAt: string) {
  const date = parseDate(startsAt);

  if (!date) {
    return startsAt;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function maskEmail(email: string) {
  if (email.endsWith("@pin2wingolf.local")) {
    return "No email captured";
  }

  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return "email on booking";
  }

  const visible = name.slice(0, Math.min(3, name.length));

  return `${visible}${"*".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}

function maskName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "Booking customer";
  }

  const [firstName, ...rest] = parts;
  const lastInitial = rest.at(-1)?.[0];

  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
}

export function toPublicBookingMatch(
  booking: BookingVerificationRecord,
): PublicBookingMatch {
  return {
    id: booking.id,
    maskedName: maskName(booking.customerName),
    maskedEmail: maskEmail(booking.customerEmail),
    locationName: booking.locationName,
    bayName: booking.bayName,
    productName: booking.productName,
    reservationLabel: reservationLabel(booking.reservationStartsAt),
    status: booking.status,
  };
}

export async function listBookingVerificationRecords() {
  const prisma = getPrismaClient();

  if (prisma) {
    const bookings = await prisma.bookingVerification.findMany({
      orderBy: { reservationStartsAt: "desc" },
    });

    return bookings.map(toBookingRecord);
  }

  const bookings = await readBookingsMap();

  return Object.values(bookings).sort(
    (a, b) =>
      new Date(b.reservationStartsAt).getTime() -
      new Date(a.reservationStartsAt).getTime(),
  );
}

export async function getBookingVerificationRecord(bookingId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    const booking = await prisma.bookingVerification.findUnique({
      where: { id: bookingId },
    });

    return booking ? toBookingRecord(booking) : null;
  }

  const bookings = await readBookingsMap();

  return bookings[bookingId] ?? null;
}

export async function createBookingVerificationRecord(input: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  locationSlug?: string;
  locationName?: string;
  bayName?: string;
  productName: string;
  reservationStartsAt: string;
  reservationEndsAt?: string;
  amountCents?: number;
  source?: BookingVerificationRecord["source"];
  externalReference?: string;
  rawEmailSubject?: string;
  rawEmailText?: string;
}) {
  const customerName = input.customerName.trim();
  const customerEmail = normalizeEmail(input.customerEmail);
  const productName = input.productName.trim();
  const reservationStartsAt = input.reservationStartsAt.trim();
  const locationName = input.locationName?.trim() || "Alamo Golf Den";
  const locationSlug =
    slugifyLocation(input.locationSlug || locationName) || "alamo-golf-den";

  if (!customerName || !customerEmail || !productName || !reservationStartsAt) {
    throw new Error("Customer name, email, product, and reservation time are required.");
  }

  const reservationStartDate = requiredDate(
    reservationStartsAt,
    "Reservation start time",
  );
  const reservationEndDate = optionalDate(input.reservationEndsAt);

  const prisma = getPrismaClient();
  const now = new Date();
  const timestamp = now.toISOString();
  const datePrefix = now.toISOString().slice(0, 10).replaceAll("-", "");
  const source = input.source ?? "Manual";
  const externalReference = input.externalReference?.trim() || undefined;

  if (prisma) {
    const existingBooking = await prisma.bookingVerification.findFirst({
      where: externalReference
        ? {
            externalReference,
            source,
          }
        : source === "Email CC" || source === "Import"
          ? {
              bayName: input.bayName?.trim() || null,
              customerName,
              locationSlug,
              reservationStartsAt: reservationStartDate,
              source,
            }
          : undefined,
    });

    if (existingBooking) {
      return toBookingRecord(existingBooking);
    }
  } else if (source === "Email CC" || source === "Import" || externalReference) {
    const bookings = Object.values(await readBookingsMap());
    const existingBooking = bookings.find((booking) => {
      if (
        externalReference &&
        booking.externalReference === externalReference &&
        booking.source === source
      ) {
        return true;
      }

      return (
        (source === "Email CC" || source === "Import") &&
        booking.source === source &&
        booking.locationSlug === locationSlug &&
        (booking.bayName ?? "") === (input.bayName?.trim() || "") &&
        booking.customerName === customerName &&
        parseDate(booking.reservationStartsAt)?.getTime() ===
          reservationStartDate.getTime()
      );
    });

    if (existingBooking) {
      return existingBooking;
    }
  }

  const existingBookings = prisma
    ? await prisma.bookingVerification.findMany({
        select: { id: true },
        where: {
          id: {
            startsWith: `P2W-BOOKING-${datePrefix}-`,
          },
        },
      })
    : Object.values(await readBookingsMap());
  const record: BookingVerificationRecord = {
    id: nextBookingId(existingBookings, now),
    customerName,
    customerEmail,
    customerPhone: input.customerPhone?.trim() || undefined,
    locationSlug,
    locationName,
    bayName: input.bayName?.trim() || undefined,
    productName,
    reservationStartsAt,
    reservationEndsAt: input.reservationEndsAt?.trim() || undefined,
    amountCents: input.amountCents,
    source,
    externalReference,
    rawEmailSubject: input.rawEmailSubject?.trim() || undefined,
    rawEmailText: input.rawEmailText?.trim() || undefined,
    status: "Pending Match",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (prisma) {
    const booking = await prisma.bookingVerification.create({
      data: {
        id: record.id,
        customerName: record.customerName,
        customerEmail: record.customerEmail,
        customerPhone: record.customerPhone,
        locationSlug: record.locationSlug,
        locationName: record.locationName,
        bayName: record.bayName,
        productName: record.productName,
        reservationStartsAt: reservationStartDate,
        reservationEndsAt: reservationEndDate,
        amountCents: record.amountCents,
        source: record.source,
        externalReference: record.externalReference,
        rawEmailSubject: record.rawEmailSubject,
        rawEmailText: record.rawEmailText,
        status: record.status,
        createdAt: now,
        updatedAt: now,
      },
    });

    return toBookingRecord(booking);
  }

  const bookings = await readBookingsMap();

  bookings[record.id] = record;
  await writeBookingsMap(bookings);

  return record;
}

export async function updateBookingVerificationStatus(input: {
  bookingId: string;
  status: BookingVerificationStatus;
  matchedEntryId?: string;
}) {
  const prisma = getPrismaClient();

  if (prisma) {
    const existing = await prisma.bookingVerification.findUnique({
      where: { id: input.bookingId },
    });

    if (!existing) {
      throw new Error("Booking not found.");
    }

    const now = new Date();
    const booking = await prisma.bookingVerification.update({
      data: {
        status: input.status,
        matchedEntryId: input.matchedEntryId ?? existing.matchedEntryId,
        usedAt: input.status === "Used" ? now : existing.usedAt,
        updatedAt: now,
      },
      where: { id: input.bookingId },
    });

    return toBookingRecord(booking);
  }

  const bookings = await readBookingsMap();
  const booking = bookings[input.bookingId];

  if (!booking) {
    throw new Error("Booking not found.");
  }

  const now = new Date().toISOString();
  const updated: BookingVerificationRecord = {
    ...booking,
    status: input.status,
    matchedEntryId: input.matchedEntryId ?? booking.matchedEntryId,
    usedAt: input.status === "Used" ? now : booking.usedAt,
    updatedAt: now,
  };

  bookings[input.bookingId] = updated;
  await writeBookingsMap(bookings);

  return updated;
}

export async function findLikelyBookingMatch(input: {
  locationSlug?: string;
  bayName?: string;
  email?: string;
  now?: Date;
}) {
  const bookings = await listBookingVerificationRecords();
  const normalizedLocation = slugifyLocation(input.locationSlug ?? "");
  const normalizedBay = input.bayName?.trim().toLowerCase();
  const normalizedEmail = input.email ? normalizeEmail(input.email) : "";
  const now = input.now ?? new Date();
  const windowStart = new Date(now.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const candidates = bookings.filter((booking) => {
    if (booking.status === "Used" || booking.status === "Rejected") {
      return false;
    }

    if (normalizedLocation && booking.locationSlug !== normalizedLocation) {
      return false;
    }

    if (
      normalizedBay &&
      booking.bayName &&
      booking.bayName.trim().toLowerCase() !== normalizedBay
    ) {
      return false;
    }

    if (
      normalizedEmail &&
      booking.customerEmail &&
      !booking.customerEmail.endsWith("@pin2wingolf.local") &&
      booking.customerEmail !== normalizedEmail
    ) {
      return false;
    }

    const startsAt = parseDate(booking.reservationStartsAt);

    return Boolean(startsAt && startsAt >= windowStart && startsAt <= windowEnd);
  });

  return candidates.sort((a, b) => {
    const aTime = parseDate(a.reservationStartsAt)?.getTime() ?? 0;
    const bTime = parseDate(b.reservationStartsAt)?.getTime() ?? 0;

    return Math.abs(aTime - now.getTime()) - Math.abs(bTime - now.getTime());
  })[0] ?? null;
}
