import Link from "next/link";
import { ClipboardCheck, KeyRound, ListChecks } from "lucide-react";
import { AdminLogoutForm } from "@/app/admin/logout-form";
import { LiveVerificationQueue } from "@/app/admin/verification/live-verification-queue";
import { requireAdminSession } from "@/lib/admin-auth";
import { listClubhouseEntryRecords } from "@/lib/clubhouse-entry-store";

export default async function AdminVerificationPage() {
  await requireAdminSession("/admin/verification");

  const entries = await listClubhouseEntryRecords();

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/challenges"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          Challenge admin
        </Link>

        <div className="mt-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Result review
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Verification queue
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#53605a]">
              Compare paid Pin2Win entries with E6 Clubhouse leaderboard results
              before approving prize eligibility.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/entries"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <ListChecks size={18} /> Closest log
            </Link>
            <Link
              href="/admin/entries/longest-drive"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <ClipboardCheck size={18} /> Long Drive log
            </Link>
            <Link
              href="/admin/challenges"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
            >
              <KeyRound size={18} /> Challenge codes
            </Link>
            <AdminLogoutForm />
          </div>
        </div>

        <LiveVerificationQueue initialEntries={entries} />
      </div>
    </main>
  );
}
