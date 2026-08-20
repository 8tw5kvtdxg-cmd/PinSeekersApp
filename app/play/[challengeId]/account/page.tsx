import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QrAccountGate } from "@/app/play/[challengeId]/account/qr-account-gate";
import { getClubhouseChallenge } from "@/lib/clubhouse";
import { getCurrentPlayer } from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export default async function QrAccountPage({
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

  const nextPath = `/play/${challenge.slug}?${new URLSearchParams({
    ...(location ? { location } : {}),
    ...(bay ? { bay } : {}),
  }).toString()}`;
  const player = await getCurrentPlayer();

  if (player) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-8 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          Pin2Win
        </Link>

        <QrAccountGate challengeName={challenge.name} nextPath={nextPath} />
      </div>
    </main>
  );
}
