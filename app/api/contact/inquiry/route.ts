import { sendZapierWebhook } from "@/lib/zapier";
import { consumeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const rateLimit = await consumeRateLimit({
    namespace: "contact-inquiry",
    identifier: getClientIp(request),
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const body = (await request.json()) as Record<string, unknown>;
  const name = cleanText(body.name, 180);
  const email = cleanText(body.email, 320).toLowerCase();
  const venueName = cleanText(body.venueName, 180);
  const phone = cleanText(body.phone, 80);
  const message = cleanText(body.message, 2000);

  if (!name || !email || !message) {
    return Response.json(
      { error: "Name, email, and message are required." },
      { status: 400 },
    );
  }

  if (!isEmail(email)) {
    return Response.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const lead = {
    email,
    message,
    name,
    phone,
    source: "pin2wingolf.com/contact",
    submittedAt: new Date().toISOString(),
    type: "partner_inquiry",
    venueName,
  };
  const zapier = await sendZapierWebhook(
    process.env.PARTNER_LEAD_ZAPIER_WEBHOOK_URL,
    lead,
  );

  return Response.json({ lead, zapier });
}
