import { MousePointerClick } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const builtInBookingLocations = [
  {
    id: "existing-alamo-golf-den",
    name: "Alamo Golf Den",
    slug: "alamo-golf-den",
    bookingUrl: "https://alamogolfden.golf918.net/embed/y1snhpyhqamwoh5xo4lml",
  },
];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminBookingClicksPage() {
  await requireAdminSession("/admin/booking-clicks");

  const prisma = getPrismaClient();
  const bookingLinkClick = prisma?.bookingLinkClick;
  const isClickLogReady = Boolean(bookingLinkClick);
  const [clicks, clickGroups, dbLocations] = bookingLinkClick
    ? await Promise.all([
        bookingLinkClick.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        bookingLinkClick.groupBy({
          by: ["locationSlug", "locationName"],
          _count: { _all: true },
          _max: { createdAt: true },
          orderBy: { _count: { id: "desc" } },
        }),
        prisma.location.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            bookingUrl: true,
          },
          where: {
            bookingUrl: { not: null },
            isActive: true,
          },
        }),
      ])
    : [[], [], []];
  const bookingLocations = [
    ...builtInBookingLocations,
    ...dbLocations
      .filter((location) => location.bookingUrl)
      .filter(
        (location) =>
          !builtInBookingLocations.some(
            (builtInLocation) => builtInLocation.slug === location.slug,
          ),
      )
      .map((location) => ({
        id: location.id,
        name: location.name,
        slug: location.slug,
        bookingUrl: location.bookingUrl ?? "",
      })),
  ];
  const clickGroupMap = new Map(
    clickGroups.map((group) => [group.locationSlug, group]),
  );
  const partnerCounters = bookingLocations.map((location) => {
    const group = clickGroupMap.get(location.slug);

    return {
      ...location,
      clickCount: group?._count._all ?? 0,
      lastClickedAt: group?._max.createdAt ?? null,
    };
  });

  const totalClicks = clickGroups.reduce(
    (sum, group) => sum + group._count._all,
    0,
  );

  return (
    <AdminShell
      eyebrow="Partner analytics"
      title="Booking link clicks"
      description="Track how many people click each partner booking link from the Pin2Win booking page."
    >
      {!isClickLogReady ? (
        <section className="mt-8 rounded-lg border border-[#f0d8a8] bg-[#fff8e8] p-5">
          <p className="font-black text-[#8a6419]">Booking click log is updating</p>
          <p className="mt-2 leading-7 text-[#6f5a2b]">
            Restart the local dev server after Prisma generates the new
            booking-link click model. Once the server is restarted, this page
            will show partner click counters.
          </p>
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#ded6c8] bg-white p-5">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#87908a]">
            Total clicks
          </p>
          <p className="mt-2 text-4xl font-black">{totalClicks}</p>
        </div>
        <div className="rounded-lg border border-[#ded6c8] bg-white p-5">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#87908a]">
            Partner counters
          </p>
          <p className="mt-2 text-4xl font-black">{partnerCounters.length}</p>
        </div>
        <div className="rounded-lg border border-[#ded6c8] bg-white p-5">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#87908a]">
            Latest click
          </p>
          <p className="mt-2 text-xl font-black">
            {clicks[0] ? formatDate(clicks[0].createdAt) : "No clicks yet"}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-[#ded6c8] bg-white p-5">
        <div className="flex items-center gap-3">
          <MousePointerClick className="text-[#2f6b3f]" size={26} />
          <h2 className="text-2xl font-black">Counters by partner</h2>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-[#ded6c8]">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-[#f5efdf] text-xs font-black uppercase tracking-[0.12em] text-[#6b756f]">
              <tr>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">Last click</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ded6c8]">
              {partnerCounters.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[#59655f]" colSpan={4}>
                    No partner booking links are available yet.
                  </td>
                </tr>
              ) : (
                partnerCounters.map((partner) => (
                  <tr key={partner.slug}>
                    <td className="px-4 py-3 font-black">
                      {partner.name}
                    </td>
                    <td className="px-4 py-3 text-[#59655f]">
                      {partner.slug}
                    </td>
                    <td className="px-4 py-3 font-black">
                      {partner.clickCount}
                    </td>
                    <td className="px-4 py-3 text-[#59655f]">
                      {partner.lastClickedAt
                        ? formatDate(partner.lastClickedAt)
                        : "Not available"}
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
