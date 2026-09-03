import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { ResultEntryForm } from "@/app/entry/[entryId]/result/result-entry-form";
import { getClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCurrentPlayer, normalizeEmail } from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export default async function EntryResultPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;
  const entry = await getClubhouseEntryRecord(entryId);
  const isAdmin = await isAdminAuthenticated();
  const player = isAdmin ? null : await getCurrentPlayer();

  if (!entry) {
    notFound();
  }

  const isOwner = Boolean(
    player?.email &&
      entry.playerEmail &&
      normalizeEmail(player.email) === normalizeEmail(entry.playerEmail),
  );

  if (!isAdmin && !isOwner) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-8 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-black">
            Pin2Win
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#d8cfbf] bg-white px-4 text-sm font-black text-[#18211f]"
          >
            Leaderboard
          </Link>
        </div>

        <section className="mt-8 overflow-hidden rounded-lg border border-[#ded6c8] bg-white shadow-xl shadow-[#18211f]/8">
          <div className="bg-[#18211f] p-6 text-white sm:p-8">
            <Trophy className="text-[#a8c878]" size={34} />
            <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-white/62">
              Result entry
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Enter your closest shot
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-white/72">
              Submit your closest shot out of 5. Pin2Win will verify your result
              before it appears on the monthly leaderboard.
            </p>
          </div>

          <ResultEntryForm
            entryId={entry.id}
            playerName={entry.playerName}
            simulatorUsername={entry.e6DisplayName}
            existingEvidence={entry.evidence ?? ""}
            existingResult={entry.result ?? ""}
            existingStatus={entry.resultStatus}
          />
        </section>
      </div>
    </main>
  );
}
