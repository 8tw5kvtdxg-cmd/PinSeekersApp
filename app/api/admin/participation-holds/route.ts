import { getAdminRequestIdentity } from "@/lib/admin-auth";
import { changeParticipationHold } from "@/lib/participation-holds";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { deliverParticipationHoldEmails } from "@/lib/participation-hold-email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const admin = await getAdminRequestIdentity(request);
  if (!admin) return Response.json({ error: "Administrator login required." }, { status: 401 });
  const limit = await consumeRateLimit({ namespace: "admin-participation-hold", identifier: admin.id, limit: 20, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);
  const destination = new URL("/admin/eligibility", request.url);
  try {
    const body = await request.formData();
    const email = body.get("email");
    const reason = body.get("reason");
    const action = body.get("action");
    if (typeof email !== "string" || typeof reason !== "string" || (action !== "Hold" && action !== "Release")) throw new Error("Email, action, and reason are required.");
    await changeParticipationHold({ email, reason, action, actorId: admin.id, actorEmail: admin.email });
    await deliverParticipationHoldEmails(10).catch(caught => console.error("Participation-hold email will be retried.", caught));
    destination.searchParams.set("message", "Participation hold action recorded.");
  } catch (caught) {
    destination.searchParams.set("error", caught instanceof Error ? caught.message.slice(0, 230) : "Hold action failed.");
  }
  return Response.redirect(destination, 303);
}
