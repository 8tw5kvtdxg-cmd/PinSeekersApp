import { getCurrentVerifiedPlayer } from "@/lib/player-auth";
import { getPrismaClient } from "@/lib/prisma";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { submitPrivacyRequest } from "@/lib/privacy-requests";
import { deliverPrivacyRequestEmails } from "@/lib/privacy-request-email";

export const dynamic = "force-dynamic";

export async function GET() {
  const { player, error, status } = await getCurrentVerifiedPlayer();
  if (!player) return Response.json({ error }, { status });
  const prisma = getPrismaClient();
  if (!prisma) return Response.json({ error: "Database unavailable." }, { status: 503 });
  const requests = await prisma.privacyRequest.findMany({ where: { userId: player.id },
    select: { id: true, requestType: true, status: true, identityStatus: true, dueAt: true, decision: true, response: true, createdAt: true, relatedRequestId: true },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return Response.json({ requests }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const { player, error, status } = await getCurrentVerifiedPlayer();
  if (!player) return Response.json({ error }, { status });
  const rateLimit = await consumeRateLimit({ namespace: "privacy-request", identifier: player.id, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);
  const destination = new URL("/account/privacy", request.url);
  try {
    const body = await request.formData();
    const requestType = body.get("requestType");
    const detail = body.get("detail");
    if (typeof requestType !== "string" || typeof detail !== "string") throw new Error("Type and description are required.");
    const privacyRequest = await submitPrivacyRequest({ userId: player.id, email: player.email,
      requestType, detail, relatedRequestId: typeof body.get("relatedRequestId") === "string" ? String(body.get("relatedRequestId")) : undefined,
    });
    await deliverPrivacyRequestEmails(10).catch(caught => console.error("Privacy request email will be retried.", caught));
    destination.searchParams.set("submitted", privacyRequest.id);
  } catch (caught) {
    destination.searchParams.set("error", caught instanceof Error ? caught.message.slice(0, 180) : "Privacy request could not be submitted.");
  }
  return Response.redirect(destination, 303);
}
