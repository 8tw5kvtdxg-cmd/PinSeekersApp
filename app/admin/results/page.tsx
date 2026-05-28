import Link from "next/link";
import { ClipboardCheck, KeyRound, ListChecks } from "lucide-react";
import { AdminLogoutForm } from "@/app/admin/logout-form";
import { ResultLogTable } from "@/app/admin/results/result-log-table";
import { requireAdminSession } from "@/lib/admin-auth";
import { clubhouseChallenges } from "@/lib/clubhouse";
import { listClubhouseEntryRecords } from "@/lib/clubhouse-entry-store";

export default async function AdminResultsPage() {
  await requireAdminSession("/admin/results");

  const entries = await listClubhouseEntryRecords();

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Admin results
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Manual result log
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#53605a]">
              Enter verified E6 results for each paid entry. Public leaderboards
              use entries marked Verified.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
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
              href="/admin/verification"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
            >
              <ClipboardCheck size={18} /> Review queue
            </Link>
            <AdminLogoutForm />
          </div>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-2 xl:items-start">
          {clubhouseChallenges.map((challenge) => (
            <ResultLogTable
              key={challenge.slug}
              challenge={challenge}
              initialEntries={entries}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
