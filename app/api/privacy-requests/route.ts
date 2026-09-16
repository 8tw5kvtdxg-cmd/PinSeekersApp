import { submitPrivacyRequest } from "@/lib/privacy-requests";
import { deliverPrivacyRequestEmails } from "@/lib/privacy-request-email";
import { consumeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const ip = getClientIp(request);
  const ipLimit = await consumeRateLimit({ namespace: "public-privacy-request-ip", identifier: ip, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit);
  const destination = new URL("/privacy-request", request.url);
  try {
    const body = await request.formData();
    const email = body.get("email");
    const requestType = body.get("requestType");
    const detail = body.get("detail");
    if (typeof email !== "string" || typeof requestType !== "string" || typeof detail !== "string") throw new Error("Email, type, and description are required.");
    const emailLimit = await consumeRateLimit({ namespace: "public-privacy-request-email", identifier: email, limit: 3, windowMs: 24 * 60 * 60 * 1000 });
    if (!emailLimit.allowed) return rateLimitResponse(emailLimit);
    const submitted = await submitPrivacyRequest({ email, requestType, detail });
    await deliverPrivacyRequestEmails(10).catch(caught => console.error("Privacy request email will be retried.", caught));
    destination.searchParams.set("submitted", submitted.id);
  } catch (caught) {
    destination.searchParams.set("error", caught instanceof Error ? caught.message.slice(0, 180) : "Privacy request could not be submitted.");
  }
  return Response.redirect(destination, 303);
}
