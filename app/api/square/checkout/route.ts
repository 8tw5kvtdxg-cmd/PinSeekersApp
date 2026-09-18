import { resolveChallengeCheckout } from "@/lib/challenge-checkout";
import { getClubhouseChallenge } from "@/lib/clubhouse";
import {
  createSquareCheckoutRecord,
  nextSquareCheckoutId,
} from "@/lib/square-checkout-store";
import { createSquarePaymentLink } from "@/lib/square";
import { getCurrentVerifiedPlayer } from "@/lib/player-auth";
import { recordTransactionAuditEvent } from "@/lib/transaction-audit";
import { consumeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import { getChallengeSalesState } from "@/lib/hole-in-one";
import { getPrismaClient } from "@/lib/prisma";
import { activeParticipationHold } from "@/lib/participation-holds";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const { player, error, status } = await getCurrentVerifiedPlayer();

  if (error || !player) {
    return Response.json({ error }, { status });
  }

  const rateLimit = await consumeRateLimit({
    namespace: "square-checkout",
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
  if (await activeParticipationHold(player.id)) {
    return Response.json({ error: "This account is under eligibility review. Contact Pin2Win support before purchasing." }, { status: 409 });
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
    const prisma = getPrismaClient();
    if (!prisma) throw new Error("Database is required for checkout.");
    const acceptance = await prisma.accountConsentRecord.findFirst({
      where: { userId: player.id, legalDocumentsAccepted: true, age18Accepted: true, texasResidencyAccepted: true },
      select: { id: true, documentVersion: true, combinedDocumentHash: true },
      orderBy: { acceptedAt: "desc" },
    });
    const checkoutId = nextSquareCheckoutId();
    const paymentLink = await createSquarePaymentLink({
      amountCents: challenge.entryFeeCents,
      buyerEmail: "", // Skip email pre-population due to Square API validation issues
      buyerPhoneNumber: "", // Skip phone pre-population due to Square API validation issues
      checkoutId,
      description: `Pin2Win ${challenge.name}`,
      redirectPath: "/checkout/access",
      request,
    });
    if (await getChallengeSalesState(challenge.slug) !== "Open") {
      return Response.json({ error: "This challenge was paused before checkout could be issued." }, { status: 409 });
    }
    await resolveChallengeCheckout(challenge.slug, assignment.bay.location.slug, assignment.bay.name);
    const checkout = await createSquareCheckoutRecord({
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
      squareOrderId: paymentLink.orderId,
      squarePaymentLinkId: paymentLink.id,
      squarePaymentLinkUrl: paymentLink.url,
      acceptedConsentRecordId: acceptance?.id,
      acceptedDocumentVersion: acceptance?.documentVersion,
      acceptedPackageHash: acceptance?.combinedDocumentHash,
    });

    await recordTransactionAuditEvent({
      checkoutId: checkout.id,
      provider: "square",
      event: "checkout_created",
      status: "Pending",
      meta: {
        amountCents: checkout.amountCents,
        locationSlug: checkout.locationSlug ?? "",
        squareOrderId: checkout.squareOrderId,
        acceptedDocumentVersion: checkout.acceptedDocumentVersion ?? "grandfathered-unrecorded",
        acceptedPackageHash: checkout.acceptedPackageHash ?? "",
      },
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
