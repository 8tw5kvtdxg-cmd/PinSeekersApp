import { BarChart3, MousePointerClick, QrCode, UserCheck } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { listClubhouseEntryRecords } from "@/lib/clubhouse-entry-store";
import { getPrismaClient } from "@/lib/prisma";
import { slugifyLocation } from "@/lib/location-utils";

export const dynamic = "force-dynamic";

const builtInBookingLocations = [
  {
    id: "existing-alamo-golf-den",
    name: "Alamo Golf Den",
    slug: "alamo-golf-den",
  },
];

function formatPercent(numerator: number, denominator: number) {
  if (!denominator) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatDate(value: Date | string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminFunnelPage() {
  await requireAdminSession("/admin/funnel");

  const prisma = getPrismaClient();
  const entries = await listClubhouseEntryRecords();
  const [bookingClickGroups, qrScanGroups, qrScanStatusGroups, dbLocations] = prisma
    ? await Promise.all([
        prisma.bookingLinkClick
          ? prisma.bookingLinkClick.groupBy({
              by: ["locationSlug"],
              _count: { _all: true },
              _max: { createdAt: true },
            })
          : Promise.resolve([]),
        prisma.qrScan
          ? prisma.qrScan.groupBy({
              by: ["locationSlug"],
              _count: { _all: true },
              _max: { createdAt: true },
            })
          : Promise.resolve([]),
        prisma.qrScan
          ? prisma.qrScan.groupBy({
              by: ["locationSlug", "bookingMatchStatus"],
              _count: { _all: true },
            })
          : Promise.resolve([]),
        prisma.location.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
          },
          where: {
            bookingUrl: { not: null },
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
  const rows = locations.map((location) => {
    const bookingClicks = bookingClickMap.get(location.slug)?._count._all ?? 0;
    const qrScans = qrScanMap.get(location.slug)?._count._all ?? 0;
    const entrySummary = entryMap[location.slug] ?? {
      confirmedEntries: 0,
      entries: 0,
      latestEntryAt: null,
    };
    const scanStatusSummary = qrScanStatusMap[location.slug] ?? {
      matched: 0,
      unmatched: 0,
    };

    return {
      bookingClicks,
      confirmedEntries: entrySummary.confirmedEntries,
      entries: entrySummary.entries,
      latestActivityAt:
        entrySummary.latestEntryAt ??
        qrScanMap.get(location.slug)?._max.createdAt ??
        bookingClickMap.get(location.slug)?._max.createdAt ??
        null,
      location,
      matchedQrScans: scanStatusSummary.matched,
      qrScans,
      unmatchedQrScans: scanStatusSummary.unmatched,
    };
  });
  const totals = rows.reduce(
    (summary, row) => ({
      bookingClicks: summary.bookingClicks + row.bookingClicks,
      confirmedEntries: summary.confirmedEntries + row.confirmedEntries,
      entries: summary.entries + row.entries,
      matchedQrScans: summary.matchedQrScans + row.matchedQrScans,
      qrScans: summary.qrScans + row.qrScans,
      unmatchedQrScans: summary.unmatchedQrScans + row.unmatchedQrScans,
    }),
    {
      bookingClicks: 0,
      confirmedEntries: 0,
      entries: 0,
      matchedQrScans: 0,
      qrScans: 0,
      unmatchedQrScans: 0,
    },
  );

  return (
    <AdminShell
      eyebrow="Partner analytics"
      title="Customer funnel"
      description="Compare booking interest, onsite QR scans, created entries, and confirmed entries by partner location."
    >
      <section className="mt-8 grid gap-4 md:grid-cols-6">
        {[
          {
            label: "Booking clicks",
            value: totals.bookingClicks,
            icon: MousePointerClick,
          },
          { label: "QR scans", value: totals.qrScans, icon: QrCode },
          {
            label: "Matched scans",
            value: totals.matchedQrScans,
            icon: UserCheck,
          },
          {
            label: "Needs review",
            value: totals.unmatchedQrScans,
            icon: BarChart3,
          },
          { label: "Entries", value: totals.entries, icon: BarChart3 },
          {
            label: "Confirmed",
            value: totals.confirmedEntries,
            icon: UserCheck,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-lg border border-[#ded6c8] bg-white p-5"
            >
              <Icon className="text-[#2f6b3f]" size={24} />
              <p className="mt-4 text-sm font-black uppercase tracking-[0.14em] text-[#59655f]">
                {item.label}
              </p>
              <p className="mt-2 text-4xl font-black">{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 rounded-lg border border-[#ded6c8] bg-white p-5">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-[#2f6b3f]" size={26} />
          <h2 className="text-2xl font-black">Funnel by partner</h2>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-[#ded6c8]">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-[#f5efdf] text-xs font-black uppercase tracking-[0.12em] text-[#6b756f]">
              <tr>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Booking clicks</th>
                <th className="px-4 py-3">QR scans</th>
                <th className="px-4 py-3">Matched scans</th>
                <th className="px-4 py-3">Needs review</th>
                <th className="px-4 py-3">Entries</th>
                <th className="px-4 py-3">Confirmed</th>
                <th className="px-4 py-3">Scan rate</th>
                <th className="px-4 py-3">Entry rate</th>
                <th className="px-4 py-3">Latest activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ded6c8]">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[#59655f]" colSpan={10}>
                    Add a partner booking link to start measuring funnel
                    performance.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.location.slug}>
                    <td className="px-4 py-3">
                      <p className="font-black">{row.location.name}</p>
                      <p className="mt-1 text-xs font-bold text-[#87908a]">
                        {row.location.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-black">{row.bookingClicks}</td>
                    <td className="px-4 py-3 font-black">{row.qrScans}</td>
                    <td className="px-4 py-3 font-black">
                      {row.matchedQrScans}
                    </td>
                    <td className="px-4 py-3 font-black">
                      {row.unmatchedQrScans}
                    </td>
                    <td className="px-4 py-3 font-black">{row.entries}</td>
                    <td className="px-4 py-3 font-black">
                      {row.confirmedEntries}
                    </td>
                    <td className="px-4 py-3 text-[#59655f]">
                      {formatPercent(row.qrScans, row.bookingClicks)}
                    </td>
                    <td className="px-4 py-3 text-[#59655f]">
                      {formatPercent(row.entries, row.qrScans)}
                    </td>
                    <td className="px-4 py-3 text-[#59655f]">
                      {formatDate(row.latestActivityAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
