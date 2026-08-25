import type { ClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";

type RevenuePerformanceCardProps = {
  entries: ClubhouseEntryRecord[];
};

type MonthlyRevenueBucket = {
  label: string;
  currentYearCents: number;
  priorYearCents: number;
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

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(cents / 100);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildRevenuePerformance(entries: ClubhouseEntryRecord[]) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const priorYear = currentYear - 1;
  const currentYearMonths = Array.from({ length: 12 }, () => 0);
  const priorYearMonths = Array.from({ length: 12 }, () => 0);
  const paidEntries = entries.filter(
    (entry) => entry.paymentStatus === "Succeeded",
  );

  paidEntries.forEach((entry) => {
    const date = asDate(entry.createdAt);

    if (!date) {
      return;
    }

    if (date.getFullYear() === currentYear) {
      currentYearMonths[date.getMonth()] += entry.amountCents ?? 0;
    }

    if (date.getFullYear() === priorYear) {
      priorYearMonths[date.getMonth()] += entry.amountCents ?? 0;
    }
  });

  const currentYearEntries = paidEntries.filter(
    (entry) => asDate(entry.createdAt)?.getFullYear() === currentYear,
  );
  const priorYearRevenueCents = priorYearMonths.reduce(
    (sum, cents) => sum + cents,
    0,
  );
  const currentYearRevenueCents = currentYearMonths.reduce(
    (sum, cents) => sum + cents,
    0,
  );
  const transactions = currentYearEntries.length;

  return {
    currentRangeLabel: `Jan 1 - ${formatShortDate(now)}`,
    currentYear,
    grossSalesCents: currentYearRevenueCents,
    priorRangeLabel: `Jan 1 - Dec 31, ${priorYear}`,
    transactions,
    buckets: monthLabels.map<MonthlyRevenueBucket>((label, index) => ({
      currentYearCents: currentYearMonths[index],
      label,
      priorYearCents: priorYearMonths[index],
    })),
  };
}

function chartMaxFromCents(maxCents: number) {
  if (maxCents <= 100) {
    return 100;
  }

  return Math.ceil(maxCents / 100) * 100;
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#ece5d8] bg-[#faf8f3] p-5">
      <p className="text-sm font-bold text-[#70756f]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#101514]">{value}</p>
    </div>
  );
}

export function RevenuePerformanceCard({
  entries,
}: RevenuePerformanceCardProps) {
  const performance = buildRevenuePerformance(entries);
  const chartMax = chartMaxFromCents(
    Math.max(
      ...performance.buckets.flatMap((bucket) => [
        bucket.currentYearCents,
        bucket.priorYearCents,
      ]),
      0,
    ),
  );

  return (
    <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-6 shadow-sm shadow-[#18211f]/5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-black">Revenue performance</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#ded6c8] px-4 text-sm font-bold text-[#70756f]">
              Date <strong className="text-[#101514]">This year</strong>
            </span>
            <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#ded6c8] px-4 text-sm font-bold text-[#70756f]">
              vs <strong className="text-[#101514]">Prior year</strong>
            </span>
            <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#ded6c8] px-4 text-sm font-bold text-[#70756f]">
              Payments <strong className="text-[#101514]">Succeeded</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr] lg:items-end">
        <div className="grid gap-5">
          <Metric
            label="Gross sales"
            value={formatMoney(performance.grossSalesCents)}
          />
          <Metric label="Transactions" value={String(performance.transactions)} />
          <div className="grid gap-3 pt-4 text-sm font-bold text-[#70756f]">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-sm bg-[#1167ff]" />
              <span>{performance.currentRangeLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-sm bg-[#b7d4ff]" />
              <span>{performance.priorRangeLabel}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[48px_1fr] gap-3">
              <div className="grid h-72 grid-rows-2 text-right text-sm font-bold text-[#70756f]">
                <span>{formatMoney(chartMax)}</span>
                <span className="self-end">$0.00</span>
              </div>
              <div className="relative h-72 border-b border-[#d8cfbf]">
                <div className="absolute left-0 right-0 top-0 border-t border-[#ece5d8]" />
                <div className="absolute bottom-0 left-0 right-0 border-t border-[#ece5d8]" />
                <div className="relative z-10 grid h-full grid-cols-12 items-end gap-4 px-4">
                  {performance.buckets.map((bucket) => (
                    <div
                      key={bucket.label}
                      className="flex h-full items-end justify-center gap-1"
                    >
                      <div
                        className="w-3 rounded-t-md bg-[#1167ff]"
                        style={{
                          height:
                            bucket.currentYearCents === 0
                              ? "0"
                              : `${Math.max(
                                  3,
                                  (bucket.currentYearCents / chartMax) * 100,
                                )}%`,
                        }}
                      />
                      <div
                        className="w-3 rounded-t-md bg-[#b7d4ff]"
                        style={{
                          height:
                            bucket.priorYearCents === 0
                              ? "0"
                              : `${Math.max(
                                  3,
                                  (bucket.priorYearCents / chartMax) * 100,
                                )}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div />
              <div className="grid grid-cols-12 gap-4 px-4 pt-3 text-center text-sm font-bold text-[#70756f]">
                {performance.buckets.map((bucket) => (
                  <span key={bucket.label}>{bucket.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
