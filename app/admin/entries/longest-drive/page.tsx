import Link from "next/link";
import { ClipboardCheck, Flag, KeyRound } from "lucide-react";
import { AdminLogoutForm } from "@/app/admin/logout-form";
import { LiveEntryLog } from "@/app/admin/entries/live-entry-log";
import { requireAdminSession } from "@/lib/admin-auth";
import { listClubhouseEntryRecords } from "@/lib/clubhouse-entry-store";

const challengeSlug = "alamo-long-drive-weekly";

export default async function LongestDriveEntriesPage() {
  await requireAdminSession("/admin/entries/longest-drive");

  const entries = await listClubhouseEntryRecords();
  const initialEntries = entries.filter(
    (entry) => entry.challengeSlug === challengeSlug,
  );

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Admin verification
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Long Drive entry log
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#53605a]">
              Live log for players who enter the Alamo Golf Den Long Drive
              challenge. Closest to the Pin entries are kept separate.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/entries"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <Flag size={18} /> Closest to the Pin log
            </Link>
            <Link
              href="/admin/challenges"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <KeyRound size={18} /> Challenge codes
            </Link>
            <Link
              href="/admin/verification"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
            >
              <ClipboardCheck size={18} /> Review results
            </Link>
            <AdminLogoutForm />
          </div>
        </div>

        <LiveEntryLog
          initialEntries={initialEntries}
          challengeFilter={challengeSlug}
        />
      </div>
    </main>
  );
}
