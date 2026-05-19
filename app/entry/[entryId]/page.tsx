import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { EventCodePanel } from "@/app/entry/[entryId]/event-code-panel";
import { getClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";
import {
  getClubhouseChallenge,
  getClubhouseEntry,
} from "@/lib/clubhouse";

export default async function EntryConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ entryId: string }>;
  searchParams: Promise<{ challenge?: string }>;
}) {
  const { entryId } = await params;
  const { challenge: challengeSlug } = await searchParams;
  const loggedEntry = await getClubhouseEntryRecord(entryId);
  const savedEntry = getClubhouseEntry(entryId);
  const resolvedChallengeSlug =
    loggedEntry?.challengeSlug ??
    savedEntry?.challengeSlug ??
    challengeSlug ??
    "alamo-closest-pin-weekly";
  const challenge = getClubhouseChallenge(resolvedChallengeSlug);

  if (!challenge) {
    notFound();
  }

  const entry = loggedEntry ?? savedEntry ?? {
    id: entryId,
    challengeSlug: challenge.slug,
    playerName: "Saved on this device",
    e6DisplayName: "Saved on this device",
    paymentStatus: "Succeeded" as const,
    paidAt: "Just now",
    validFrom: "Starts after payment",
    validUntil: `${challenge.playWindowMinutes} minutes after payment`,
    attemptLimit: 1,
    resultStatus: "Pending E6 Result" as const,
  };

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/play/${challenge.slug}`}
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          Back to challenge
        </Link>

        <section className="mt-10 overflow-hidden rounded-lg border border-[#ded6c8] bg-white shadow-xl shadow-[#18211f]/8">
          <div className="bg-[#18211f] p-6 text-white">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-[#a8c878]" size={30} />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-white/62">
                  Paid entry confirmation
                </p>
                <h1 className="mt-2 text-3xl font-black">{entry.id}</h1>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <h2 className="text-2xl font-black">{challenge.name}</h2>
              <p className="mt-3 text-base leading-7 text-[#59655f]">
                Keep this screen available while you enter the E6 event and
                complete the challenge.
              </p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                    Player
                  </dt>
                  <dd className="mt-1 font-black">{entry.playerName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                    E6 display name
                  </dt>
                  <dd className="mt-1 font-black">{entry.e6DisplayName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                    Payment
                  </dt>
                  <dd className="mt-1 font-black">{entry.paymentStatus}</dd>
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                    Attempt limit
                  </dt>
                  <dd className="mt-1 font-black">
                    {entry.attemptLimit} eligible attempt
                  </dd>
                </div>
              </dl>
            </div>

            <EventCodePanel
              fallbackEventCode={
                "e6EventCode" in entry ? entry.e6EventCode : challenge.e6JoinCode
              }
              entryId={entry.id}
            />
          </div>

          <div className="grid gap-5 border-t border-[#ece5d8] bg-[#fbf8f1] p-6 lg:grid-cols-3">
            <div>
              <CalendarClock className="text-[#2f6b3f]" size={24} />
              <h3 className="mt-3 font-black">Valid window</h3>
              <p className="mt-2 text-sm leading-6 text-[#59655f]">
                {entry.validFrom} to {entry.validUntil}
              </p>
            </div>
            <div>
              <Trophy className="text-[#2f6b3f]" size={24} />
              <h3 className="mt-3 font-black">Prize eligibility</h3>
              <p className="mt-2 text-sm leading-6 text-[#59655f]">
                Your result must match this paid entry before it can qualify for
                prizes.
              </p>
            </div>
            <div>
              <ShieldCheck className="text-[#2f6b3f]" size={24} />
              <h3 className="mt-3 font-black">Verification</h3>
              <p className="mt-2 text-sm leading-6 text-[#59655f]">
                Pin2Win verifies prize results against the E6 Clubhouse
                leaderboard before payout.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
