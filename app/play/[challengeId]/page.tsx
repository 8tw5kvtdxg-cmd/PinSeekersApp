import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryFlow } from "@/app/play/[challengeId]/entry-flow";
import { getClubhouseChallenge } from "@/lib/clubhouse";
import { recordQrScan } from "@/lib/qr-scan-store";

export default async function ClubhouseChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ challengeId: string }>;
  searchParams: Promise<{ bay?: string; location?: string }>;
}) {
  const { challengeId } = await params;
  const { bay, location } = await searchParams;
  const challenge = getClubhouseChallenge(challengeId);

  if (!challenge) {
    notFound();
  }

  await recordQrScan({
    bayName: bay,
    challengeSlug: challenge.slug,
    locationSlug: location,
  });

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
