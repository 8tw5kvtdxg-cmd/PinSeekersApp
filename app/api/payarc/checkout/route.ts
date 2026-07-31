import { getClubhouseChallenge } from "@/lib/clubhouse";
import {
  createPayarcCheckoutRecord,
  nextPayarcCheckoutId,
} from "@/lib/payarc-checkout-store";
import {
  createPayarcOrder,
  getPayarcCheckoutScriptUrl,
} from "@/lib/payarc";
import { getCurrentVerifiedPlayer } from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { player, error, status } = await getCurrentVerifiedPlayer();

  if (error || !player) {
    return Response.json({ error }, { status });
  }

  const body = (await request.json()) as {
    challengeSlug?: unknown;
    playerName?: unknown;
    phoneNumber?: unknown;
    e6DisplayName?: unknown;
    locationSlug?: unknown;
    bayName?: unknown;
  };
  const challengeSlug =
    typeof body.challengeSlug === "string" ? body.challengeSlug : "";
  const challenge = getClubhouseChallenge(challengeSlug);

  if (!challenge) {
    return Response.json({ error: "Challenge not found." }, { status: 404 });
  }

  const playerName =
    typeof body.playerName === "string" ? body.playerName.trim() : "";
  const phoneNumber =
    typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
  const e6DisplayName =
    typeof body.e6DisplayName === "string" ? body.e6DisplayName.trim() : "";

  if (!playerName || !phoneNumber || !e6DisplayName) {
    return Response.json(
      { error: "Player name, phone number, and simulator account name are required." },
      { status: 400 },
    );
  }

  try {
    const checkoutId = nextPayarcCheckoutId();
    const order = await createPayarcOrder({
      amountCents: challenge.entryFeeCents,
      orderName: checkoutId,
    });
    const checkout = await createPayarcCheckoutRecord({
      id: checkoutId,
      playerEmail: player.email,
      challengeSlug: challenge.slug,
      playerName,
      phoneNumber,
      e6DisplayName,
      locationSlug:
        typeof body.locationSlug === "string" ? body.locationSlug : "",
      locationName: challenge.venue,
      bayName: typeof body.bayName === "string" ? body.bayName : "",
      amountCents: challenge.entryFeeCents,
      payarcOrderId: order.id,
      payarcOrderToken: order.token,
      paymentFormUrl: order.paymentFormUrl,
    });

    return Response.json(
      {
        checkout: {
          id: checkout.id,
          amountCents: checkout.amountCents,
          payarcOrderId: checkout.payarcOrderId,
          payarcOrderToken: checkout.payarcOrderToken,
          paymentFormUrl: checkout.paymentFormUrl,
          checkoutScriptUrl: getPayarcCheckoutScriptUrl(),
        },
      },
      { status: 201 },
    );
  } catch (caughtError) {
    return Response.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Payarc checkout could not be created.",
      },
      { status: 400 },
    );
  }
}
