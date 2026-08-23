import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ListChecks,
  MailCheck,
  MapPin,
  PencilLine,
  Plus,
  ReceiptText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { clubhouseChallenges, formatCurrency } from "@/lib/clubhouse";
import { listBookingVerificationRecords } from "@/lib/booking-verification-store";
import {
  getClubhouseLocationRevenueSummaries,
  listClubhouseEntryRecords,
} from "@/lib/clubhouse-entry-store";
import { RevenuePerformanceCard } from "@/app/admin/revenue-performance-card";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const quickActions = [
  {
    href: "/admin/bookings",
    title: "Verify bookings",
    text: "Add or review Alamo bookings that unlock the QR flow.",
    icon: MailCheck,
  },
  {
    href: "/admin/challenges",
    title: "Set event code",
    text: "Update the shared simulator event code and event timing.",
    icon: KeyRound,
  },
  {
    href: "/admin/entries",
    title: "Monitor entries",
    text: "Watch QR registrations and booking matches as they come in.",
    icon: ListChecks,
  },
  {
    href: "/admin/results",
    title: "Log results",
    text: "Enter and review simulator outcomes for operating records.",
    icon: PencilLine,
  },
];

function formatDateTime(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function parseDateTime(value: string) {
  const date = new Date(value);

  return Number.isFinite(date.getTime()) ? date : null;
}

export default async function AdminDashboardPage() {
  await requireAdminSession("/admin");

  const prisma = getPrismaClient();
  const [entries, bookings, revenueSummaryMap, userCount, dbLocationCount] =
    await Promise.all([
      listClubhouseEntryRecords(),
      listBookingVerificationRecords(),
      getClubhouseLocationRevenueSummaries(),
      prisma ? prisma.user.count() : Promise.resolve(0),
      prisma
        ? prisma.location.count({ where: { slug: { not: "alamo-golf-den" } } })
        : Promise.resolve(0),
    ]);
  const registeredEntries = entries.filter(
    (entry) => entry.paymentStatus === "Succeeded",
  );
  const pendingBookings = bookings.filter(
    (booking) => booking.status === "Pending Match",
  );
  const usedBookings = bookings.filter((booking) => booking.status === "Used");
  const reviewEntries = entries.filter(
    (entry) =>
      entry.resultStatus === "Needs Review" ||
      entry.resultStatus === "Pending E6 Result",
  );
  const revenueCents = Object.values(revenueSummaryMap).reduce(
    (sum, summary) => sum + summary.revenueCents,
    0,
  );
  const locationCount = Math.max(
    1 + dbLocationCount,
    new Set(["alamo-golf-den", ...Object.keys(revenueSummaryMap)]).size,
  );
  const now = new Date();
  const upcomingBookings = bookings
    .filter((booking) => {
      const reservationStartsAt = parseDateTime(booking.reservationStartsAt);

      return reservationStartsAt
        ? reservationStartsAt.getTime() >= now.getTime()
        : false;
    })
    .sort((left, right) => {
      const leftTime = parseDateTime(left.reservationStartsAt)?.getTime() ?? 0;
      const rightTime = parseDateTime(right.reservationStartsAt)?.getTime() ?? 0;

      return leftTime - rightTime;
    })
    .slice(0, 5);
  const activeChallenge = clubhouseChallenges[0];

  return (
    <AdminShell
      title="Operations dashboard"
      description="A focused command center for Pin2Win operations: checkout activity, QR entries, event-code readiness, locations, and result review."
      actions={
        <>
          <Link
            href="/admin/bookings"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
          >
            <MailCheck size={18} /> Booking queue
          </Link>
          <Link
            href="/admin/locations/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
          >
            <Plus size={18} /> Add partner
          </Link>
        </>
      }
    >
      <section className="mt-8 grid gap-4 md:grid-cols-5">
        {[
          {
            label: "Pending bookings",
            value: pendingBookings.length,
            icon: MailCheck,
          },
          {
            label: "Used bookings",
            value: usedBookings.length,
            icon: CheckCircle2,
          },
          {
            label: "Entries",
            value: registeredEntries.length,
            icon: ListChecks,
          },
          {
            label: "Review items",
            value: reviewEntries.length,
            icon: ShieldCheck,
          },
          {
            label: "Revenue",
            value: formatCurrency(revenueCents),
            icon: ReceiptText,
          },
          {
            label: "Users",
            value: userCount,
            icon: UsersRound,
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
              <p className="mt-2 text-3xl font-black">{item.value}</p>
            </div>
          );
        })}
      </section>

      <RevenuePerformanceCard entries={registeredEntries} />

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-[#ded6c8] bg-white p-6">
          <div className="flex items-center gap-3">
            <KeyRound className="text-[#2f6b3f]" size={26} />
            <h2 className="text-2xl font-black">Challenge readiness</h2>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-[#fbf8f1] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                Active challenge
              </dt>
              <dd className="mt-2 font-black">{activeChallenge?.name}</dd>
            </div>
            <div className="rounded-md bg-[#fbf8f1] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                Play window
              </dt>
              <dd className="mt-2 font-black">
                {activeChallenge?.playWindowMinutes} minutes
              </dd>
            </div>
            <div className="rounded-md bg-[#fbf8f1] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                Simulator event code
              </dt>
              <dd className="mt-2 font-black">{activeChallenge?.e6JoinCode}</dd>
            </div>
            <div className="rounded-md bg-[#fbf8f1] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                Locations
              </dt>
              <dd className="mt-2 font-black">{locationCount}</dd>
            </div>
          </dl>
          <Link
            href="/admin/challenges"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
          >
            Edit event settings <ArrowRight size={17} />
          </Link>
        </div>

        <div className="rounded-lg border border-[#ded6c8] bg-white p-6">
          <div className="flex items-center gap-3">
            <MailCheck className="text-[#2f6b3f]" size={26} />
            <h2 className="text-2xl font-black">Next bookings</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {upcomingBookings.length === 0 ? (
              <p className="rounded-md bg-[#fbf8f1] p-4 text-sm font-bold text-[#59655f]">
                No upcoming booking records yet.
              </p>
            ) : (
              upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="grid gap-3 rounded-md bg-[#fbf8f1] p-4 sm:grid-cols-[1fr_170px_130px]"
                >
                  <div>
                    <p className="font-black">{booking.customerName}</p>
                    <p className="mt-1 text-sm font-bold text-[#59655f]">
                      {booking.productName}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#59655f]">
                    {formatDateTime(booking.reservationStartsAt)}
                  </p>
                  <span className="inline-flex h-8 w-fit items-center rounded-md bg-white px-3 text-xs font-black text-[#2f6b3f]">
                    {booking.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link
            href="/admin/bookings"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#2f6b3f] px-5 text-sm font-black text-[#2f6b3f] transition hover:bg-[#e3edd8]"
          >
            Manage bookings <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border border-[#ded6c8] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#2f6b3f] hover:shadow-xl hover:shadow-[#18211f]/10"
            >
              <Icon className="text-[#2f6b3f]" size={28} />
              <h2 className="mt-4 text-xl font-black">{item.title}</h2>
              <p className="mt-3 min-h-14 text-sm leading-6 text-[#59655f]">
                {item.text}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#2f6b3f]">
                Open <ArrowRight size={16} />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-6">
        <div className="flex items-center gap-3">
          <MapPin className="text-[#2f6b3f]" size={26} />
          <h2 className="text-2xl font-black">Operating model</h2>
        </div>
        <p className="mt-4 max-w-4xl leading-7 text-[#59655f]">
          Pin2Win manages QR entry, checkout activation, event-code access,
          location reporting, and result records so partner venues can run a
          repeatable golf entertainment experience.
        </p>
      </section>
    </AdminShell>
  );
}
