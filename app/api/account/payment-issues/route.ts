import { customerManagedClaimWhere } from "@/lib/refund-claim-source";
import { getCurrentVerifiedPlayer } from "@/lib/player-auth";
import { getPrismaClient } from "@/lib/prisma";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import { submitPaymentIssue } from "@/lib/refund-claims";
import { prepareRefundEvidence } from "@/lib/refund-evidence";
import { deliverPaymentIssueCommunications } from "@/lib/refund-claim-email";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const { player, error, status } = await getCurrentVerifiedPlayer();
  if (!player) return Response.json({ error }, { status });
  const prisma = getPrismaClient();
  if (!prisma) return Response.json({ error: "Database unavailable." }, { status: 503 });
  const claims = await prisma.paymentIssueClaim.findMany({
    where: { playerId: player.id, ...customerManagedClaimWhere }, orderBy: { createdAt: "desc" }, take: 100,
    select: { id: true, checkoutId: true, entryId: true, reason: true, status: true, createdAt: true, lateSubmissionFlag: true },
  });
  return Response.json({ claims });
}

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const { player, error, status } = await getCurrentVerifiedPlayer();
  if (!player) return Response.json({ error }, { status });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 3.5 * 1024 * 1024) return Response.json({ error: "Claim upload is too large." }, { status: 413 });
  const rateLimit = await consumeRateLimit({
    namespace: "payment-issue-claim", identifier: player.id, limit: 5, windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);
  const body = await request.formData();
  const checkoutId = body.get("checkoutId");
  const reason = body.get("reason");
  const narrative = body.get("narrative");
  const incidentAt = body.get("incidentAt");
  const file = body.get("evidenceFile");
  const destination = new URL("/account/payment-issue", request.url);
  if (typeof checkoutId !== "string" || typeof reason !== "string" || typeof narrative !== "string") {
    destination.searchParams.set("error", "Payment, reason, and description are required.");
    return Response.redirect(destination, 303);
  }
  try {
    const claim = await submitPaymentIssue({
      checkoutId, playerId: player.id, playerEmail: player.email, reason, narrative,
      venueName: typeof body.get("venueName") === "string" ? String(body.get("venueName")) : undefined,
      evidenceReference: typeof body.get("evidenceReference") === "string" ? String(body.get("evidenceReference")) : undefined,
      incidentAt: typeof incidentAt === "string" && incidentAt ? new Date(incidentAt) : null,
      evidenceFile: file instanceof File && file.size > 0 ? await prepareRefundEvidence(file) : null,
    });
    await deliverPaymentIssueCommunications(5, claim.id).catch((caught) => console.error("Refund claim email will be retried.", caught));
    destination.searchParams.set("submitted", claim.id);
    return Response.redirect(destination, 303);
  } catch (caught) {
    destination.searchParams.set("error", caught instanceof Error ? caught.message.slice(0, 200) : "Claim could not be submitted.");
    return Response.redirect(destination, 303);
  }
}
