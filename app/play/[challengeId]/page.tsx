import { resolveChallengeCheckout } from "@/lib/challenge-checkout";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EntryFlow } from "@/app/play/[challengeId]/entry-flow";
import { getClubhouseChallenge } from "@/lib/clubhouse";
import { findLikelyBookingMatch } from "@/lib/booking-verification-store";
import { getCurrentPlayer } from "@/lib/player-auth";
import { sendQrScanNotification } from "@/lib/qr-scan-notification-email";
import { recordQrScan } from "@/lib/qr-scan-store";

export default async function ClubhouseChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ challengeId: string }>;
  searchParams: Promise<{
    bay?: string;
    autoCheckout?: string;
    checkoutId?: string;
    location?: string;
    orderId?: string;
    referenceId?: string;
    squareCheckoutId?: string;
    transactionId?: string;
  }>;
}) {
  const { challengeId } = await params;
  const {
    bay,
    autoCheckout,
    checkoutId,
    location,
    orderId,
    referenceId,
    squareCheckoutId,
    transactionId,
  } = await searchParams;
  const challenge = getClubhouseChallenge(challengeId);

  if (!challenge) {
    notFound();
  }

  let venueName = "Your approved partner venue";
  const returning = Boolean(squareCheckoutId || checkoutId || referenceId);
  if (!returning) {
    try { const assignment = await resolveChallengeCheckout(challenge.slug, location || "", bay || ""); venueName = assignment.bay.location.name; }
    catch { return <main className="mx-auto max-w-xl p-8"><h1 className="text-3xl font-black">Challenge entry unavailable</h1><p className="my-6">This challenge is not currently open at this bay. Please use an approved onsite QR code when the challenge opens.</p><Link href="/rent" className="font-bold underline">Book simulator time with a partner</Link></main>; }
  }
  const booking = location
    ? await findLikelyBookingMatch({
        bayName: bay,
        locationSlug: location,
      })
    : null;

  await recordQrScan({
    bayName: bay,
    bookingMatchStatus: location ? (booking ? "Matched" : "No Match") : undefined,
    bookingVerificationId: booking?.id,
    challengeSlug: challenge.slug,
    locationSlug: location,
  }).catch(() => null);

  if (location) {
    await sendQrScanNotification({
      bayName: bay,
      booking,
      challengeName: challenge.name,
      locationSlug: location,
      scanUrl: `/play/${challenge.slug}?${new URLSearchParams({
        ...(location ? { location } : {}),
        ...(bay ? { bay } : {}),
      }).toString()}`,
    }).catch((error) => {
      console.error("QR scan notification failed", error);
    });
  }

  const player = await getCurrentPlayer();
  const isReturningFromCheckout = Boolean(
    squareCheckoutId || checkoutId || referenceId,
  );

  if (!player && !isReturningFromCheckout) {
    redirect(
      `/play/${challenge.slug}/account?${new URLSearchParams({
        ...(location ? { location } : {}),
        ...(bay ? { bay } : {}),
      }).toString()}`,
    );
  }

  if (player && !player.emailVerifiedAt && !isReturningFromCheckout) {
    const next = `/play/${challenge.slug}?${new URLSearchParams({ ...(location ? { location } : {}), ...(bay ? { bay } : {}), autoCheckout: "1" })}`;
    redirect(`/account/verify?next=${encodeURIComponent(next)}`);
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
          <EntryFlow
            challenge={{
              eligibilityRules: challenge.eligibilityRules,
              entryFeeCents: challenge.entryFeeCents,
              name: challenge.name,
              playWindowMinutes: challenge.playWindowMinutes,
              slug: challenge.slug,
              venue: venueName,
            }}
            autoCheckout={
              autoCheckout === "1" ||
              Boolean(player && !isReturningFromCheckout)
            }
            squareReturn={{
              checkoutId: squareCheckoutId ?? checkoutId ?? referenceId ?? "",
              orderId: orderId ?? "",
              paymentId: transactionId ?? "",
            }}
          />
        </div>
      </div>
    </main>
  );
}
