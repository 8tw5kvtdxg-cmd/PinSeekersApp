import Link from "next/link";
import {
  ClipboardCheck,
  KeyRound,
  ListChecks,
  MapPin,
  PencilLine,
  Plus,
  QrCode,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { AdminLogoutForm } from "@/app/admin/logout-form";
import { requireAdminSession } from "@/lib/admin-auth";
import { clubhouseChallenges, formatCurrency } from "@/lib/clubhouse";
import {
  getClubhouseLocationRevenueSummaries,
  listClubhouseEntryRecords,
} from "@/lib/clubhouse-entry-store";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dashboardLinks = [
  {
    href: "/admin/locations",
    title: "Locations",
    text: "Create partners, generate QR codes for every location, and review revenue.",
    icon: MapPin,
    action: "Manage locations",
  },
  {
    href: "/admin/users",
    title: "Users",
    text: "Review new player accounts, email verification status, and activity.",
    icon: UsersRound,
    action: "Open user log",
  },
  {
    href: "/admin/entries",
    title: "Entries",
    text: "Monitor paid Closest to the Pin entries and player details.",
    icon: ListChecks,
    action: "Open entry log",
  },
  {
    href: "/admin/entries/longest-drive",
    title: "Long Drive",
    text: "Monitor Long Drive entries separately from Closest to the Pin.",
    icon: QrCode,
    action: "Open long drive",
  },
  {
    href: "/admin/results",
    title: "Results",
    text: "Enter verified simulator results for eligible paid entries.",
    icon: PencilLine,
    action: "Log results",
  },
  {
    href: "/admin/verification",
    title: "Review queue",
    text: "Approve or reject prize-eligible results before payouts.",
    icon: ClipboardCheck,
    action: "Review results",
  },
  {
    href: "/admin/challenges",
    title: "Global E6 codes",
    text: "Manage challenge event codes used by the QR entry flow.",
    icon: KeyRound,
    action: "Edit codes",
  },
];

export default async function AdminDashboardPage() {
  await requireAdminSession("/admin");

  const prisma = getPrismaClient();
  const [entries, revenueSummaryMap, userCount, dbLocationCount] =
    await Promise.all([
      listClubhouseEntryRecords(),
      getClubhouseLocationRevenueSummaries(),
      prisma ? prisma.user.count() : Promise.resolve(0),
      prisma
        ? prisma.location.count({ where: { slug: { not: "alamo-golf-den" } } })
        : Promise.resolve(0),
    ]);
  const paidEntries = entries.filter(
    (entry) => entry.paymentStatus === "Succeeded",
  );
  const revenueCents = Object.values(revenueSummaryMap).reduce(
    (sum, summary) => sum + summary.revenueCents,
    0,
  );
  const locationCount = Math.max(
    1 + dbLocationCount,
    new Set(["alamo-golf-den", ...Object.keys(revenueSummaryMap)]).size,
  );

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Admin portal
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Operations dashboard
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#53605a]">
              Start here for partner QR codes, location revenue, player
              accounts, entries, results, and global E6 challenge codes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/locations/new"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
            >
              <Plus size={18} /> New location
            </Link>
            <AdminLogoutForm />
          </div>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            {
              label: "Paid entries",
              value: paidEntries.length,
              icon: ListChecks,
            },
            {
              label: "Location revenue",
              value: formatCurrency(revenueCents),
              icon: ReceiptText,
            },
            {
              label: "Locations",
              value: locationCount,
              icon: MapPin,
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
                <Icon className="text-[#2f6b3f]" size={26} />
                <p className="mt-4 text-sm font-black uppercase tracking-[0.14em] text-[#59655f]">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-black">{item.value}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {dashboardLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-[#ded6c8] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#2f6b3f] hover:shadow-xl hover:shadow-[#18211f]/10"
              >
                <Icon className="text-[#2f6b3f]" size={28} />
                <h2 className="mt-4 text-2xl font-black">{item.title}</h2>
                <p className="mt-3 min-h-18 text-sm leading-6 text-[#59655f]">
                  {item.text}
                </p>
                <span className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#18211f] px-4 text-sm font-black text-white">
                  {item.action}
                </span>
              </Link>
            );
          })}
        </section>

        <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-6">
          <div className="flex items-center gap-3">
            <KeyRound className="text-[#2f6b3f]" size={26} />
            <h2 className="text-2xl font-black">Challenge code scope</h2>
          </div>
          <p className="mt-4 max-w-4xl leading-7 text-[#59655f]">
            Challenge codes are global event settings for the current E6
            Clubhouse competitions. Location-specific QR codes and revenue
            accounting live in Locations, where each partner venue can generate
            QR links into the same challenge flow.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {clubhouseChallenges.map((challenge) => (
              <span
                key={challenge.slug}
                className="rounded-md bg-[#fbf8f1] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#59655f]"
              >
                {challenge.type.replaceAll("_", " ")}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
