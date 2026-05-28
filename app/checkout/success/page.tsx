import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createClubhouseEntryRecord,
  getClubhouseEntryRecordByStripeSessionId,
} from "@/lib/clubhouse-entry-store";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
        <div className="mx-auto max-w-xl rounded-lg border border-[#ded6c8] bg-white p-6">
          <h1 className="text-3xl font-black">Checkout session missing</h1>
          <p className="mt-4 leading-7 text-[#59655f]">
            Return to the challenge page and start checkout again.
          </p>
          <Link
            href="/play"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#18211f] px-5 text-sm font-black text-white"
          >
            Back to Play Now
          </Link>
        </div>
      </main>
    );
  }

  const existingEntry = await getClubhouseEntryRecordByStripeSessionId(sessionId);

  if (existingEntry) {
    redirect(
      `/entry/${existingEntry.id}?challenge=${existingEntry.challengeSlug}`,
    );
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return (
      <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
        <div className="mx-auto max-w-xl rounded-lg border border-[#ded6c8] bg-white p-6">
          <h1 className="text-3xl font-black">Payment is not complete yet</h1>
          <p className="mt-4 leading-7 text-[#59655f]">
            Stripe has not marked this checkout session as paid. If you just
            completed payment, refresh this page in a moment.
          </p>
        </div>
      </main>
    );
  }

  const challengeSlug = session.metadata?.challengeSlug ?? "";
  const playerName = session.metadata?.playerName ?? "";
  const phoneNumber = session.metadata?.phoneNumber ?? "";
  const e6DisplayName = session.metadata?.e6DisplayName ?? "";

  const entry = await createClubhouseEntryRecord({
    challengeSlug,
    playerName,
    phoneNumber,
    e6DisplayName,
    stripeCheckoutSessionId: session.id,
  });

  redirect(`/entry/${entry.id}?challenge=${entry.challengeSlug}`);
}
