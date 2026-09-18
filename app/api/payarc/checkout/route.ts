import { resolveChallengeCheckout } from "@/lib/challenge-checkout";
import { getClubhouseChallenge } from "@/lib/clubhouse";
import { isLegacyPayarcEnabled } from "@/lib/payment-provider";
import {
  createPayarcCheckoutRecord,
  nextPayarcCheckoutId,
} from "@/lib/payarc-checkout-store";
import {
  createPayarcOrder,
  getPayarcCheckoutScriptUrl,
} from "@/lib/payarc";
import { getCurrentVerifiedPlayer } from "@/lib/player-auth";
import { consumeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import { getChallengeSalesState } from "@/lib/hole-in-one";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  if (!isLegacyPayarcEnabled()) {
    return Response.json(
      {
        error: "Payarc is disabled for this deployment. Square is the active payment provider.",
      },
      { status: 410 },
    );
  }
  const { player, error, status } = await getCurrentVerifiedPlayer();

  if (error || !player) {
    return Response.json({ error }, { status });
  }

  const rateLimit = await consumeRateLimit({
    namespace: "payarc-checkout",
    identifier: `${player.id}:${getClientIp(request)}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

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
  if (await getChallengeSalesState(challenge.slug) !== "Open") {
    return Response.json({ error: "This challenge is paused or closed to new entries." }, { status: 409 });
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
    const assignment = await resolveChallengeCheckout(challenge.slug, typeof body.locationSlug === "string" ? body.locationSlug.trim() : "", typeof body.bayName === "string" ? body.bayName.trim() : "");
    const checkoutId = nextPayarcCheckoutId();
    const order = await createPayarcOrder({
      amountCents: challenge.entryFeeCents,
      orderName: checkoutId,
    });
    if (await getChallengeSalesState(challenge.slug) !== "Open") {
      return Response.json({ error: "This challenge was paused before checkout could be issued." }, { status: 409 });
    }
    await resolveChallengeCheckout(challenge.slug, assignment.bay.location.slug, assignment.bay.name);
    const checkout = await createPayarcCheckoutRecord({
      id: checkoutId,
      playerEmail: player.email,
      challengeSlug: challenge.slug,
      playerName,
      phoneNumber,
      e6DisplayName,
      locationSlug: assignment.bay.location.slug,
      locationName: assignment.bay.location.name,
      bayName: assignment.bay.name,
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
