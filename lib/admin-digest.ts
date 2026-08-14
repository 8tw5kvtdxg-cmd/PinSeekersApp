import { listBookingVerificationRecords } from "@/lib/booking-verification-store";
import { listClubhouseEntryRecords } from "@/lib/clubhouse-entry-store";
import { slugifyLocation } from "@/lib/location-utils";
import { getPrismaClient } from "@/lib/prisma";

const builtInBookingLocations = [
  {
    id: "existing-alamo-golf-den",
    name: "Alamo Golf Den",
    slug: "alamo-golf-den",
  },
];

function sinceDate(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function asDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isFinite(date.getTime()) ? date : null;
}

export async function getAdminDigest(days = 1) {
  const prisma = getPrismaClient();
  const since = sinceDate(days);
  const entries = (await listClubhouseEntryRecords()).filter((entry) => {
    const createdAt = asDate(entry.createdAt);

    return Boolean(createdAt && createdAt >= since);
  });
  const bookingVerifications = (
    await listBookingVerificationRecords()
  ).filter((booking) => {
    const createdAt = asDate(booking.createdAt);

    return Boolean(createdAt && createdAt >= since);
  });
  const [bookingClickGroups, qrScanGroups, qrScanStatusGroups, dbLocations] = prisma
    ? await Promise.all([
        prisma.bookingLinkClick.groupBy({
          by: ["locationSlug"],
          _count: { _all: true },
          _max: { createdAt: true },
          where: { createdAt: { gte: since } },
        }),
        prisma.qrScan.groupBy({
          by: ["locationSlug"],
          _count: { _all: true },
          _max: { createdAt: true },
          where: { createdAt: { gte: since } },
        }),
        prisma.qrScan.groupBy({
          by: ["locationSlug", "bookingMatchStatus"],
          _count: { _all: true },
          where: { createdAt: { gte: since } },
        }),
        prisma.location.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
          },
          where: {
            isActive: true,
          },
        }),
      ])
    : [[], [], [], []];
  const locations = [
    ...builtInBookingLocations,
    ...dbLocations.filter(
      (location) =>
        !builtInBookingLocations.some(
          (builtInLocation) => builtInLocation.slug === location.slug,
        ),
    ),
  ];
  const bookingClickMap = new Map(
    bookingClickGroups.map((group) => [group.locationSlug, group]),
  );
  const qrScanMap = new Map(qrScanGroups.map((group) => [group.locationSlug, group]));
  const qrScanStatusMap = qrScanStatusGroups.reduce<
    Record<string, { matched: number; unmatched: number }>
  >((summaries, group) => {
    const current = summaries[group.locationSlug] ?? {
      matched: 0,
      unmatched: 0,
    };

    summaries[group.locationSlug] = {
      matched:
        current.matched +
        (group.bookingMatchStatus === "Matched" ? group._count._all : 0),
      unmatched:
        current.unmatched +
        (group.bookingMatchStatus === "No Match" ? group._count._all : 0),
    };

    return summaries;
  }, {});
  const entryMap = entries.reduce<
    Record<
      string,
      {
        confirmedEntries: number;
        entries: number;
        latestEntryAt: string | null;
      }
    >
  >((summaries, entry) => {
    const locationSlug =
      entry.locationSlug || slugifyLocation(entry.locationName || "unknown");
    const current = summaries[locationSlug] ?? {
      confirmedEntries: 0,
      entries: 0,
      latestEntryAt: null,
    };

    summaries[locationSlug] = {
      confirmedEntries:
        current.confirmedEntries +
        (entry.entryDecisionStatus === "Confirmed" ? 1 : 0),
      entries: current.entries + 1,
      latestEntryAt:
        !current.latestEntryAt ||
        new Date(entry.createdAt).getTime() >
          new Date(current.latestEntryAt).getTime()
          ? entry.createdAt
          : current.latestEntryAt,
    };

    return summaries;
  }, {});
  const bookingVerificationMap = bookingVerifications.reduce<
    Record<string, { bookingVerifications: number; latestBookingAt: string | null }>
  >((summaries, booking) => {
    const current = summaries[booking.locationSlug] ?? {
      bookingVerifications: 0,
      latestBookingAt: null,
    };

    summaries[booking.locationSlug] = {
      bookingVerifications: current.bookingVerifications + 1,
      latestBookingAt:
        !current.latestBookingAt ||
        new Date(booking.createdAt).getTime() >
          new Date(current.latestBookingAt).getTime()
          ? booking.createdAt
          : current.latestBookingAt,
    };

    return summaries;
  }, {});
  const rows = locations.map((location) => {
    const bookingClicks = bookingClickMap.get(location.slug)?._count._all ?? 0;
    const qrScans = qrScanMap.get(location.slug)?._count._all ?? 0;
    const entrySummary = entryMap[location.slug] ?? {
      confirmedEntries: 0,
      entries: 0,
      latestEntryAt: null,
    };
    const bookingSummary = bookingVerificationMap[location.slug] ?? {
      bookingVerifications: 0,
      latestBookingAt: null,
    };
    const scanStatusSummary = qrScanStatusMap[location.slug] ?? {
      matched: 0,
      unmatched: 0,
    };

    return {
      bookingClicks,
      bookingVerifications: bookingSummary.bookingVerifications,
      confirmedEntries: entrySummary.confirmedEntries,
      entries: entrySummary.entries,
      latestActivityAt:
        entrySummary.latestEntryAt ??
        bookingSummary.latestBookingAt ??
        qrScanMap.get(location.slug)?._max.createdAt?.toISOString() ??
        bookingClickMap.get(location.slug)?._max.createdAt?.toISOString() ??
        null,
      locationName: location.name,
      locationSlug: location.slug,
      matchedQrScans: scanStatusSummary.matched,
      qrScans,
      unmatchedQrScans: scanStatusSummary.unmatched,
    };
  });
  const totals = rows.reduce(
    (summary, row) => ({
      bookingClicks: summary.bookingClicks + row.bookingClicks,
      bookingVerifications:
        summary.bookingVerifications + row.bookingVerifications,
      confirmedEntries: summary.confirmedEntries + row.confirmedEntries,
      entries: summary.entries + row.entries,
      matchedQrScans: summary.matchedQrScans + row.matchedQrScans,
      qrScans: summary.qrScans + row.qrScans,
      unmatchedQrScans: summary.unmatchedQrScans + row.unmatchedQrScans,
    }),
    {
      bookingClicks: 0,
      bookingVerifications: 0,
      confirmedEntries: 0,
      entries: 0,
      matchedQrScans: 0,
      qrScans: 0,
      unmatchedQrScans: 0,
    },
  );

  return {
    generatedAt: new Date().toISOString(),
    period: {
      days,
      since: since.toISOString(),
    },
    rows,
    totals,
  };
}
