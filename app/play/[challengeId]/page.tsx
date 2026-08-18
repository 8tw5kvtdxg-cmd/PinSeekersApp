import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryFlow } from "@/app/play/[challengeId]/entry-flow";
import { getClubhouseChallenge } from "@/lib/clubhouse";
import { findLikelyBookingMatch } from "@/lib/booking-verification-store";
import { sendQrScanNotification } from "@/lib/qr-scan-notification-email";
import { recordQrScan } from "@/lib/qr-scan-store";

export default async function ClubhouseChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ challengeId: string }>;
  searchParams: Promise<{
    bay?: string;
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
  });

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
            challenge={challenge}
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
