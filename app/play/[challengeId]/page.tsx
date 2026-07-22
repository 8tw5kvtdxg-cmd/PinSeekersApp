import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryFlow } from "@/app/play/[challengeId]/entry-flow";
import { getClubhouseChallenge } from "@/lib/clubhouse";

export default async function ClubhouseChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const challenge = getClubhouseChallenge(challengeId);

  if (!challenge) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/play"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          Back to Play Now
        </Link>
        <div className="mt-10">
          <EntryFlow challenge={challenge} />
        </div>
      </div>
    </main>
  );
}
