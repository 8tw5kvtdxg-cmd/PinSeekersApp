import Stripe from "stripe";
import { createClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

async function createEntryFromCheckoutSession(session: Stripe.Checkout.Session) {
  const challengeSlug = session.metadata?.challengeSlug ?? "";
  const playerName = session.metadata?.playerName ?? "";
  const e6DisplayName = session.metadata?.e6DisplayName ?? "";

  if (!challengeSlug || !playerName || !e6DisplayName) {
    throw new Error("Stripe session is missing Pin2Win entry metadata.");
  }

  return createClubhouseEntryRecord({
    challengeSlug,
    playerName,
    e6DisplayName,
    stripeCheckoutSessionId: session.id,
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return Response.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature) {
    return Response.json({ error: "Stripe signature missing." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not verify Stripe webhook.",
      },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.payment_status === "paid") {
      await createEntryFromCheckoutSession(session);
    }
  }

  return Response.json({ received: true });
}

