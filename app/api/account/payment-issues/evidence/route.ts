import { getCurrentVerifiedPlayer } from "@/lib/player-auth";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import { prepareRefundEvidence } from "@/lib/refund-evidence";
import { addPaymentIssueEvidence } from "@/lib/refund-claims";
import { deliverPaymentIssueCommunications } from "@/lib/refund-claim-email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const { player, error, status } = await getCurrentVerifiedPlayer();
  if (!player) return Response.json({ error }, { status });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 3.5 * 1024 * 1024) return Response.json({ error: "Evidence upload is too large." }, { status: 413 });
  const rateLimit = await consumeRateLimit({ namespace: "payment-issue-evidence", identifier: player.id, limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);
  const destination = new URL("/account/payment-issue", request.url);
  const body = await request.formData();
  const claimId = body.get("claimId");
  const file = body.get("evidenceFile");
  try {
    if (typeof claimId !== "string" || !(file instanceof File) || !file.size) throw new Error("Claim and evidence file are required.");
    const evidenceId = await addPaymentIssueEvidence({
      claimId, playerId: player.id, playerEmail: player.email,
      evidenceFile: await prepareRefundEvidence(file),
    });
    await deliverPaymentIssueCommunications(10).catch((caught) => console.error("Evidence notification pending retry.", caught));
    destination.searchParams.set("uploaded", evidenceId);
  } catch (caught) {
    destination.searchParams.set("error", caught instanceof Error ? caught.message.slice(0, 200) : "Evidence upload failed.");
  }
  return Response.redirect(destination, 303);
}
