import { getClubhouseChallenge } from "@/lib/clubhouse";
import { getAppUrl, getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    challengeSlug?: unknown;
    playerName?: unknown;
    e6DisplayName?: unknown;
  };
  const challengeSlug =
    typeof body.challengeSlug === "string" ? body.challengeSlug : "";
  const playerName = typeof body.playerName === "string" ? body.playerName.trim() : "";
  const e6DisplayName =
    typeof body.e6DisplayName === "string" ? body.e6DisplayName.trim() : "";
  const challenge = getClubhouseChallenge(challengeSlug);

  if (!challenge) {
    return Response.json({ error: "Challenge not found." }, { status: 404 });
  }

  if (!playerName || !e6DisplayName) {
    return Response.json(
      { error: "Full name and E6 account name are required." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const appUrl = getAppUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: challenge.name,
              description: `${challenge.venue} - ${challenge.e6EventName}`,
            },
            unit_amount: challenge.entryFeeCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        challengeSlug: challenge.slug,
        playerName,
        e6DisplayName,
      },
      payment_intent_data: {
        metadata: {
          challengeSlug: challenge.slug,
          playerName,
          e6DisplayName,
        },
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/play/${challenge.slug}?checkout=cancelled`,
    });

    if (!session.url) {
      return Response.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return Response.json({ checkoutUrl: session.url });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not start Stripe Checkout.",
      },
      { status: 500 },
    );
  }
}

