import { getAdminRequestIdentity } from "@/lib/admin-auth";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { openPotentialWinnerClaim, sendPotentialWinnerNotice, updateWinnerClaim } from "@/lib/winner-claims";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const admin = await getAdminRequestIdentity(request);
  if (!admin) return Response.json({ error: "Administrator login required." }, { status: 401 });
  const rateLimit = await consumeRateLimit({ namespace: "admin-winner-claims", identifier: admin.id, limit: 20, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);
  const destination = new URL("/admin/prize-claims", request.url);
  try {
    const body = await request.formData();
    const action = body.get("action");
    const note = body.get("note");
    const claimId = body.get("claimId");
    if (typeof action !== "string" || typeof note !== "string") throw new Error("Action and attributed note are required.");
    if (action === "Open") {
      const reportId = body.get("reportId");
      if (typeof reportId !== "string") throw new Error("Report is required.");
      await openPotentialWinnerClaim({ reportId, actorId: admin.id, actorEmail: admin.email, note });
    } else if (action === "Send Notice") {
      if (typeof claimId !== "string") throw new Error("Claim is required.");
      await sendPotentialWinnerNotice({ claimId, actorId: admin.id, actorEmail: admin.email, note });
    } else {
      if (typeof claimId !== "string") throw new Error("Claim is required.");
      const amountDollars = body.get("amountDollars");
      let amountCents: number | undefined;
      if (action === "Approve Payout") {
        if (typeof amountDollars !== "string" || !/^\d{1,4}(?:\.\d{1,2})?$/.test(amountDollars)) throw new Error("Enter a valid payout amount.");
        const [whole, fraction = ""] = amountDollars.split(".");
        amountCents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
      }
      await updateWinnerClaim({ claimId, action, note, actorId: admin.id, actorEmail: admin.email,
        value: action === "Collection Method" ? (typeof body.get("method") === "string" ? String(body.get("method")) : undefined)
          : typeof body.get("value") === "string" ? String(body.get("value")) : undefined,
        method: typeof body.get("method") === "string" ? String(body.get("method")) : undefined,
        amountCents,
      });
    }
    destination.searchParams.set("message", "Prize claim action saved.");
  } catch (caught) {
    destination.searchParams.set("error", caught instanceof Error ? caught.message.slice(0, 240) : "Prize claim action failed.");
  }
  return Response.redirect(destination, 303);
}
