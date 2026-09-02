import { BarChart3 } from "lucide-react";
import type { BookingVerificationRecord } from "@/lib/booking-verification-store";

type BookingEmailAnalyticsProps = {
  bookings: BookingVerificationRecord[];
  selectedLocationSlug?: string;
};

type MonthlyBookingBucket = {
  label: string;
  count: number;
  isFuture: boolean;
};

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function asDate(value: string) {
  const date = new Date(value);

  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDateTime(value: string) {
  const date = asDate(value);

  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(cents?: number) {
  if (typeof cents !== "number") {
    return "Not captured";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(cents / 100);
}

function displayEmail(email: string) {
  return email.endsWith("@pin2wingolf.local") ? "No email captured" : email;
}

function buildMonthlyBuckets(bookings: BookingVerificationRecord[]) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const counts = Array.from({ length: 12 }, () => 0);

  bookings.forEach((booking) => {
    const date = asDate(booking.createdAt);

    if (!date || date.getFullYear() !== currentYear) {
      return;
    }

    counts[date.getMonth()] += 1;
  });

  return counts.map<MonthlyBookingBucket>((count, index) => ({
    count,
    isFuture: index > currentMonth,
    label: monthLabels[index],
  }));
}

function chartMaxFromCount(maxCount: number) {
  if (maxCount <= 10) {
    return 10;
  }

  return Math.ceil(maxCount / 5) * 5;
}

function MonthlyBookingsChart({
  buckets,
  year,
}: {
  buckets: MonthlyBookingBucket[];
  year: number;
}) {
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 0);
  const chartMax = chartMaxFromCount(maxCount);
  const yAxisLabels = Array.from({ length: 5 }, (_, index) =>
    Math.round((chartMax / 4) * (4 - index)),
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[44px_1fr] gap-3">
          <div className="grid h-72 grid-rows-5 text-right text-xs font-black text-[#87908a]">
            {yAxisLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className="relative h-72 border-b border-l border-[#d8cfbf]">
            <div className="absolute inset-0 grid grid-rows-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="border-t border-dashed border-[#ece5d8]"
                />
              ))}
            </div>

            <div className="relative z-10 grid h-full grid-cols-12 items-end gap-3 px-4">
              {buckets.map((bucket) => (
                <div
                  key={bucket.label}
                  className="flex h-full flex-col justify-end gap-2"
                >
                  <div className="flex justify-center">
                    <span className="text-xs font-black text-[#18211f]">
                      {bucket.count}
                    </span>
                  </div>
                  <div
                    className={`min-h-1 rounded-t-md ${
                      bucket.isFuture ? "bg-[#cfd5cf]" : "bg-[#2f6b3f]"
                    }`}
                    style={{
                      height:
                        bucket.count === 0
                          ? "4px"
                          : `${Math.max(8, (bucket.count / chartMax) * 100)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div />
          <div className="grid grid-cols-12 gap-3 px-4 pt-3 text-center text-xs font-black uppercase tracking-[0.08em] text-[#59655f]">
            {buckets.map((bucket) => (
              <span
                key={bucket.label}
                className={bucket.isFuture ? "text-[#b3bab4]" : undefined}
              >
                {bucket.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[44px_1fr] gap-3 text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
          <span>Count</span>
          <span className="text-center">Date {year}</span>
        </div>
      </div>
    </div>
  );
}

function PreviousBookingsTable({
  bookings,
}: {
  bookings: BookingVerificationRecord[];
}) {
  const capturedBookings = [...bookings].sort((left, right) => {
    const leftTime = asDate(left.createdAt)?.getTime() ?? 0;
    const rightTime = asDate(right.createdAt)?.getTime() ?? 0;

    return rightTime - leftTime;
  });

  return (
    <div className="mt-8 border-t border-[#ece5d8] pt-6">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h3 className="text-xl font-black">Captured booking emails</h3>
          <p className="mt-1 text-sm font-bold text-[#59655f]">
            All booking confirmations received by Pin2Win, including upcoming reservations.
          </p>
        </div>
        <p className="text-sm font-black text-[#87908a]">
          {capturedBookings.length} total
        </p>
      </div>

      {capturedBookings.length === 0 ? (
        <div className="rounded-md bg-[#fbf8f1] p-4 text-sm font-bold text-[#59655f]">
          No booking emails have been captured yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#ece5d8]">
          <table className="min-w-[760px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#f2eadb] text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Reservation</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece5d8] bg-white">
              {capturedBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-4">
                    <p className="font-black text-[#18211f]">
                      {booking.customerName}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#59655f]">
                      {displayEmail(booking.customerEmail)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-black text-[#18211f]">
                      {booking.locationName}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#59655f]">
                      {booking.bayName || booking.productName}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-bold text-[#59655f]">
                    {formatDateTime(booking.reservationStartsAt)}
                  </td>
                  <td className="px-4 py-4 font-black text-[#18211f]">
                    {formatCurrency(booking.amountCents)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex h-8 items-center rounded-md bg-[#fbf8f1] px-3 text-xs font-black text-[#2f6b3f]">
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function BookingEmailAnalytics({
  bookings,
  selectedLocationSlug,
}: BookingEmailAnalyticsProps) {
  const visibleBookings = selectedLocationSlug
    ? bookings.filter((booking) => booking.locationSlug === selectedLocationSlug)
    : bookings;
  const buckets = buildMonthlyBuckets(visibleBookings);
  const currentYear = new Date().getFullYear();

  return (
    <section className="mt-10 rounded-lg border border-[#ded6c8] bg-white p-6">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="text-[#2f6b3f]" size={28} />
            <h2 className="text-2xl font-black">Bookings over time</h2>
          </div>
          <p className="mt-2 text-sm font-bold leading-6 text-[#59655f]">
            Monthly booking email count for {currentYear}.
          </p>
        </div>
        <div className="rounded-md bg-[#fbf8f1] px-4 py-3 text-right">
          <p className="text-2xl font-black">{visibleBookings.length}</p>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
            total captured
          </p>
        </div>
      </div>

      <MonthlyBookingsChart buckets={buckets} year={currentYear} />
      <PreviousBookingsTable bookings={visibleBookings} />
    </section>
  );
}
