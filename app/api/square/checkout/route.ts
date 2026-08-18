import { getClubhouseChallenge } from "@/lib/clubhouse";
import {
  createSquareCheckoutRecord,
  nextSquareCheckoutId,
} from "@/lib/square-checkout-store";
import { createSquarePaymentLink } from "@/lib/square";
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
    const checkoutId = nextSquareCheckoutId();
    const redirectPath = `/play/${challenge.slug}?${new URLSearchParams({
      ...(typeof body.locationSlug === "string" && body.locationSlug
        ? { location: body.locationSlug }
        : {}),
      ...(typeof body.bayName === "string" && body.bayName
        ? { bay: body.bayName }
        : {}),
    }).toString()}`;
    const paymentLink = await createSquarePaymentLink({
      amountCents: challenge.entryFeeCents,
      checkoutId,
      description: `Pin2Win ${challenge.name}`,
      redirectPath,
      request,
    });
    const checkout = await createSquareCheckoutRecord({
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
      squareOrderId: paymentLink.orderId,
      squarePaymentLinkId: paymentLink.id,
      squarePaymentLinkUrl: paymentLink.url,
    });

    return Response.json(
      {
        checkout: {
          id: checkout.id,
          amountCents: checkout.amountCents,
          paymentFormUrl: checkout.squarePaymentLinkUrl,
          squareOrderId: checkout.squareOrderId,
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
            : "Square checkout could not be created.",
      },
      { status: 400 },
    );
  }
}
