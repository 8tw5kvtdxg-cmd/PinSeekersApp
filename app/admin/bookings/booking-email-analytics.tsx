import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MailCheck,
  MapPin,
  TrendingUp,
} from "lucide-react";
import type { BookingVerificationRecord } from "@/lib/booking-verification-store";
import type { PartnerLocationSummary } from "@/lib/partner-locations";

type BookingEmailAnalyticsProps = {
  bookings: BookingVerificationRecord[];
  locations: PartnerLocationSummary[];
  selectedLocationSlug?: string;
};

type ChartBucket = {
  label: string;
  count: number;
};

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function asDate(value: string) {
  const date = new Date(value);

  return Number.isFinite(date.getTime()) ? date : null;
}

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();

  nextDate.setHours(0, 0, 0, 0);
  nextDate.setDate(nextDate.getDate() - day);

  return nextDate;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function bucketKey(date: Date, period: "week" | "month") {
  const bucketDate = period === "week" ? startOfWeek(date) : startOfMonth(date);

  return bucketDate.toISOString().slice(0, 10);
}

function bucketLabel(key: string, period: "week" | "month") {
  const date = new Date(`${key}T00:00:00`);

  if (!Number.isFinite(date.getTime())) {
    return key;
  }

  if (period === "month") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(date);
  }

  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 6);

  return `${shortDateFormatter.format(date)}-${shortDateFormatter.format(endDate)}`;
}

function buildBuckets(bookings: BookingVerificationRecord[], period: "week" | "month") {
  const buckets = bookings.reduce<Record<string, number>>((summary, booking) => {
    const date = asDate(booking.createdAt);

    if (!date) {
      return summary;
    }

    const key = bucketKey(date, period);

    summary[key] = (summary[key] ?? 0) + 1;

    return summary;
  }, {});

  return Object.entries(buckets)
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-8)
    .map<ChartBucket>(([key, count]) => ({
      label: bucketLabel(key, period),
      count,
    }));
}

function formatDate(value: string) {
  const date = asDate(value);

  return date ? fullDateFormatter.format(date) : "Not available";
}

function buildLocationRows(
  locations: PartnerLocationSummary[],
  bookings: BookingVerificationRecord[],
) {
  const bookingLocationMap = new Map(
    bookings.map((booking) => [
      booking.locationSlug,
      {
        id: `booking-${booking.locationSlug}`,
        name: booking.locationName,
        slug: booking.locationSlug,
        bookingUrl: null,
        websiteUrl: null,
        isActive: true,
      },
    ]),
  );
  const mergedLocations = [
    ...locations,
    ...Array.from(bookingLocationMap.values()).filter(
      (bookingLocation) =>
        !locations.some((location) => location.slug === bookingLocation.slug),
    ),
  ];

  return mergedLocations.map((location) => {
    const locationBookings = bookings.filter(
      (booking) => booking.locationSlug === location.slug,
    );
    const latestBooking = locationBookings
      .slice()
      .sort(
        (left, right) =>
          (asDate(right.createdAt)?.getTime() ?? 0) -
          (asDate(left.createdAt)?.getTime() ?? 0),
      )[0];

    return {
      location,
      bookings: locationBookings,
      bookingCount: locationBookings.length,
      latestBookingAt: latestBooking?.createdAt ?? null,
    };
  });
}

function Chart({
  buckets,
  emptyLabel,
}: {
  buckets: ChartBucket[];
  emptyLabel: string;
}) {
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

  if (buckets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#ded6c8] bg-[#fbf8f1] p-6 text-sm font-bold text-[#59655f]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {buckets.map((bucket) => (
        <div
          key={bucket.label}
          className="grid grid-cols-[94px_1fr_42px] items-center gap-3 text-sm"
        >
          <p className="font-bold text-[#59655f]">{bucket.label}</p>
          <div className="h-9 overflow-hidden rounded-md bg-[#edf1ea]">
            <div
              className="h-full rounded-md bg-[#2f6b3f]"
              style={{ width: `${Math.max(8, (bucket.count / maxCount) * 100)}%` }}
            />
          </div>
          <p className="text-right font-black text-[#18211f]">{bucket.count}</p>
        </div>
      ))}
    </div>
  );
}

export function BookingEmailAnalytics({
  bookings,
  locations,
  selectedLocationSlug,
}: BookingEmailAnalyticsProps) {
  const locationRows = buildLocationRows(locations, bookings);
  const selectedLocation = selectedLocationSlug
    ? locationRows.find((row) => row.location.slug === selectedLocationSlug)
    : null;
  const visibleBookings = selectedLocation ? selectedLocation.bookings : bookings;
  const recentBookings = visibleBookings
    .slice()
    .sort(
      (left, right) =>
        (asDate(right.createdAt)?.getTime() ?? 0) -
        (asDate(left.createdAt)?.getTime() ?? 0),
    );
  const weeklyBuckets = buildBuckets(visibleBookings, "week");
  const monthlyBuckets = buildBuckets(visibleBookings, "month");
  const latestBooking = recentBookings[0];
  const titlePrefix = selectedLocation?.location.name ?? "All partners";

  return (
    <div className="mt-10 grid gap-8">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Booking emails", String(visibleBookings.length), MailCheck],
          ["Partner locations", String(selectedLocation ? 1 : locationRows.length), MapPin],
          [
            "Latest email",
            latestBooking ? formatDate(latestBooking.createdAt) : "None yet",
            CalendarDays,
          ],
        ].map(([label, value, Icon]) => (
          <div
            key={label as string}
            className="rounded-lg border border-[#ded6c8] bg-white p-5"
          >
            <Icon className="text-[#2f6b3f]" size={26} />
            <p className="mt-4 text-2xl font-black">{value as string}</p>
            <p className="mt-1 text-sm font-bold text-[#59655f]">
              {label as string}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-[#ded6c8] bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <TrendingUp className="text-[#2f6b3f]" size={25} />
            <div>
              <h2 className="text-2xl font-black">{titlePrefix} weekly bookings</h2>
              <p className="mt-1 text-sm font-bold text-[#59655f]">
                Counted by booking emails received.
              </p>
            </div>
          </div>
          <Chart buckets={weeklyBuckets} emptyLabel="No booking emails captured yet." />
        </div>

        <div className="rounded-lg border border-[#ded6c8] bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <CalendarDays className="text-[#2f6b3f]" size={25} />
            <div>
              <h2 className="text-2xl font-black">{titlePrefix} monthly bookings</h2>
              <p className="mt-1 text-sm font-bold text-[#59655f]">
                Used to show partner demand growth over time.
              </p>
            </div>
          </div>
          <Chart buckets={monthlyBuckets} emptyLabel="No monthly booking data yet." />
        </div>
      </section>

      {!selectedLocation ? (
        <section className="overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
          <div className="bg-[#18211f] px-5 py-4 text-white">
            <h2 className="text-2xl font-black">Partner booking pages</h2>
            <p className="mt-1 text-sm font-bold text-white/62">
              Each active partner location gets its own booking analytics page.
            </p>
          </div>
          <div className="divide-y divide-[#ece5d8]">
            {locationRows.map((row) => (
              <Link
                key={row.location.slug}
                href={`/admin/bookings/${row.location.slug}`}
                className="grid gap-4 px-5 py-5 transition hover:bg-[#fbf8f1] md:grid-cols-[1.2fr_0.7fr_1fr_auto]"
              >
                <div>
                  <p className="font-black">{row.location.name}</p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    {row.location.slug}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black">{row.bookingCount}</p>
                  <p className="text-sm font-bold text-[#59655f]">booking emails</p>
                </div>
                <div>
                  <p className="text-sm font-black text-[#18211f]">
                    {row.latestBookingAt
                      ? formatDate(row.latestBookingAt)
                      : "No emails yet"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    latest captured booking
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-black text-[#2f6b3f]">
                  View page <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
        <div className="bg-[#18211f] px-5 py-4 text-white">
          <h2 className="text-2xl font-black">Recent booking emails</h2>
          <p className="mt-1 text-sm font-bold text-white/62">
            Incoming partner booking confirmations captured from the parser.
          </p>
        </div>
        {visibleBookings.length === 0 ? (
          <div className="p-8 text-center">
            <MailCheck className="mx-auto text-[#2f6b3f]" size={34} />
            <h3 className="mt-4 text-xl font-black">No booking emails yet</h3>
            <p className="mt-3 text-sm leading-6 text-[#59655f]">
              Booking emails will appear here once the partner email parser posts
              into Pin2Win.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#ece5d8]">
            {recentBookings.slice(0, 12).map((booking) => (
              <article
                key={booking.id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr]"
              >
                <div>
                  <p className="font-black">{booking.customerName}</p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    {booking.customerEmail || "No email captured"}
                  </p>
                </div>
                <div>
                  <p className="font-black">{booking.locationName}</p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    {booking.bayName || booking.productName}
                  </p>
                </div>
                <div>
                  <p className="font-black">{formatDate(booking.reservationStartsAt)}</p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    reservation time
                  </p>
                </div>
                <div>
                  <p className="font-black">{formatDate(booking.createdAt)}</p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    email captured
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
