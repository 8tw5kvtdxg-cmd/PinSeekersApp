import Link from "next/link";
import {
  ClipboardCheck,
  KeyRound,
  ListChecks,
  Mail,
  MapPin,
  Phone,
  PencilLine,
  ReceiptText,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";
import { AdminHomeLink } from "@/app/admin/admin-home-link";
import { AdminLogoutForm } from "@/app/admin/logout-form";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

type AdminUserLogRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  entries: {
    id: string;
    status: string;
    createdAt: Date;
    challenge: {
      name: string;
      type: string;
    };
  }[];
  _count: {
    entries: number;
    payments: number;
  };
};

async function loadAdminUsers(): Promise<AdminUserLogRow[]> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        entries: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            createdAt: true,
            challenge: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            entries: true,
            payments: true,
          },
        },
      },
    });
  } catch {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        entries: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            createdAt: true,
            challenge: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            entries: true,
            payments: true,
          },
        },
      },
    });

    return users.map((user) => ({
      ...user,
      emailVerifiedAt: null,
    }));
  }
}

export default async function AdminUsersPage() {
  await requireAdminSession("/admin/users");

  const prisma = getPrismaClient();
  const users = await loadAdminUsers();

  const totalEntries = users.reduce(
    (sum, user) => sum + user._count.entries,
    0,
  );
  const totalPayments = users.reduce(
    (sum, user) => sum + user._count.payments,
    0,
  );

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Admin users
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Account creation log
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#53605a]">
              Review newly created player accounts with contact details, signup
              time, entry activity, and payment activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminHomeLink />
            <Link
              href="/admin/locations"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <MapPin size={18} /> Locations
            </Link>
            <Link
              href="/admin/challenges"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <KeyRound size={18} /> Challenge codes
            </Link>
            <Link
              href="/admin/entries"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <ListChecks size={18} /> Entry log
            </Link>
            <Link
              href="/admin/results"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <PencilLine size={18} /> Log results
            </Link>
            <Link
              href="/admin/verification"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
            >
              <ClipboardCheck size={18} /> Review queue
            </Link>
            <AdminLogoutForm />
          </div>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: UsersRound,
              label: "Total accounts",
              value: users.length,
            },
            {
              icon: Trophy,
              label: "Tracked entries",
              value: totalEntries,
            },
            {
              icon: ReceiptText,
              label: "Tracked payments",
              value: totalPayments,
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

        <section className="mt-8 overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
          <div className="border-b border-[#ded6c8] px-5 py-4">
            <h2 className="text-xl font-black">Newest accounts</h2>
          </div>

          {!prisma ? (
            <div className="p-6 text-sm font-bold text-[#59655f]">
              Database is not configured, so account logs are unavailable.
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-sm font-bold text-[#59655f]">
              No player accounts have been created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-[#f5efdf] text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                  <tr>
                    <th className="px-5 py-4">Player</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Email status</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4">Activity</th>
                    <th className="px-5 py-4">Latest entry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece4d6]">
                  {users.map((user) => {
                    const latestEntry = user.entries[0];

                    return (
                      <tr key={user.id} className="align-top">
                        <td className="px-5 py-5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#eaf4e4] text-[#2f6b3f]">
                              <UserRound size={20} />
                            </div>
                            <div>
                              <p className="font-black">{user.name}</p>
                              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#59655f]">
                                @{user.username}
                              </p>
                              <p className="mt-2 max-w-[18rem] break-all font-mono text-xs text-[#6b756f]">
                                {user.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="grid gap-2 text-[#33403b]">
                            <span className="inline-flex items-center gap-2">
                              <Mail size={16} className="text-[#2f6b3f]" />
                              {user.email}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Phone size={16} className="text-[#2f6b3f]" />
                              {user.phone || "No phone on file"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          {user.emailVerifiedAt ? (
                            <div>
                              <span className="rounded-md bg-[#eef7e9] px-3 py-2 text-xs font-black text-[#2f6b3f]">
                                Verified
                              </span>
                              <p className="mt-3 text-xs font-bold text-[#6b756f]">
                                {formatDate(user.emailVerifiedAt)}
                              </p>
                            </div>
                          ) : (
                            <span className="rounded-md bg-[#fff8e8] px-3 py-2 text-xs font-black text-[#8a6419]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-5">
                          <p className="font-black">
                            {formatDate(user.createdAt)}
                          </p>
                          <p className="mt-2 text-xs font-bold text-[#6b756f]">
                            Updated {formatDate(user.updatedAt)}
                          </p>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-md bg-[#eef7e9] px-3 py-2 text-xs font-black text-[#2f6b3f]">
                              {user._count.entries} entries
                            </span>
                            <span className="rounded-md bg-[#f5efdf] px-3 py-2 text-xs font-black text-[#6a4c1f]">
                              {user._count.payments} payments
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          {latestEntry ? (
                            <div>
                              <p className="font-black">
                                {latestEntry.challenge.name}
                              </p>
                              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#59655f]">
                                {latestEntry.challenge.type.replaceAll("_", " ")}
                              </p>
                              <p className="mt-2 text-xs font-bold text-[#6b756f]">
                                {latestEntry.status.replaceAll("_", " ")} on{" "}
                                {formatDate(latestEntry.createdAt)}
                              </p>
                            </div>
                          ) : (
                            <span className="font-bold text-[#6b756f]">
                              No entries yet
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
