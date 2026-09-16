import { getAdminRequestIdentity } from "@/lib/admin-auth";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { reviewPrivacyRequest } from "@/lib/privacy-requests";
import { deliverPrivacyRequestEmails } from "@/lib/privacy-request-email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const admin = await getAdminRequestIdentity(request);
  if (!admin) return Response.json({ error: "Administrator login required." }, { status: 401 });
  const rateLimit = await consumeRateLimit({ namespace: "admin-privacy-review", identifier: admin.id, limit: 30, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);
  const destination = new URL("/admin/privacy", request.url);
  try {
    const body = await request.formData();
    const requestId = body.get("requestId");
    const action = body.get("action");
    const note = body.get("note");
    if (typeof requestId !== "string" || typeof action !== "string" || typeof note !== "string") throw new Error("Request, action, and review note are required.");
    await reviewPrivacyRequest({ requestId, action, note, actorId: admin.id, actorEmail: admin.email,
      customerText: typeof body.get("customerText") === "string" ? String(body.get("customerText")) : undefined,
      fulfillmentReference: typeof body.get("fulfillmentReference") === "string" ? String(body.get("fulfillmentReference")) : undefined,
    });
    await deliverPrivacyRequestEmails(20).catch(caught => console.error("Privacy review email will be retried.", caught));
    destination.searchParams.set("message", "Privacy review saved.");
  } catch (caught) {
    destination.searchParams.set("error", caught instanceof Error ? caught.message.slice(0, 230) : "Privacy review failed.");
  }
  return Response.redirect(destination, 303);
}
