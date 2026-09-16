import { getAdminRequestIdentity } from "@/lib/admin-auth";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import { requestApprovedSquareRefund, updatePaymentIssueReview } from "@/lib/refund-claims";
import { deliverPaymentIssueCommunications } from "@/lib/refund-claim-email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const admin = await getAdminRequestIdentity(request);
  if (!admin) return Response.json({ error: "Administrator login required." }, { status: 401 });
  const body = await request.formData();
  const claimId = body.get("claimId");
  const action = body.get("action");
  const note = body.get("note");
  const destination = new URL("/admin/refunds", request.url);
  if (typeof claimId !== "string" || typeof action !== "string" || typeof note !== "string") {
    destination.searchParams.set("error", "Claim, action, and note are required.");
    return Response.redirect(destination, 303);
  }
  try {
    if (["In Review", "Denied", "Approved"].includes(action)) {
      await updatePaymentIssueReview({
        claimId, actorId: admin.id, actorEmail: admin.email,
        status: action as "In Review" | "Denied" | "Approved", note,
        customerMessage: typeof body.get("customerMessage") === "string" ? String(body.get("customerMessage")) : undefined,
        assignedTo: typeof body.get("assignedTo") === "string" ? String(body.get("assignedTo")) : undefined,
      });
    } else if (action === "refund") {
      const dollars = body.get("amountDollars");
      if (typeof dollars !== "string" || !/^\d{1,5}(?:\.\d{1,2})?$/.test(dollars)) throw new Error("Enter a valid refund amount.");
      const [whole, fraction = ""] = dollars.split(".");
      const amountCents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
      await requestApprovedSquareRefund({ claimId, actorId: admin.id, actorEmail: admin.email, amountCents, note });
    } else throw new Error("Unknown refund action.");
    await deliverPaymentIssueCommunications(10).catch((caught) => console.error("Refund update email will be retried.", caught));
    destination.searchParams.set("message", "Refund review action saved.");
  } catch (caught) {
    destination.searchParams.set("error", caught instanceof Error ? caught.message.slice(0, 250) : "Refund action failed.");
  }
  return Response.redirect(destination, 303);
}
