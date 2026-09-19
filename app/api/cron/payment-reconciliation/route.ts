import { timingSafeEqual } from "node:crypto";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import { reconcileSquareRefunds } from "@/lib/refund-claims";
import { deliverPaymentIssueCommunications } from "@/lib/refund-claim-email";
import { deliverPrivacyRequestEmails } from "@/lib/privacy-request-email";
import { deliverParticipationHoldEmails } from "@/lib/participation-hold-email";
import { rejectCrossSiteRequest } from "@/lib/request-security";

export const dynamic = "force-dynamic";

function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 16) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const refunds = await reconcileSquareRefunds().catch(error => {
      console.error("Previously requested refund status updates will be retried.", error);
      return { error: "Refund status updates pending retry." };
    });
    const communications = await deliverPaymentIssueCommunications();
    const privacyCommunications = await deliverPrivacyRequestEmails().catch(caught => {
      console.error("Privacy request emails will be retried separately.", caught);
      return 0;
    });
    const holdCommunications = await deliverParticipationHoldEmails().catch(caught => {
      console.error("Participation-hold emails will be retried separately.", caught); return 0;
    });
    return Response.json({ refunds, communications, privacyCommunications, holdCommunications });
  } catch (error) {
    console.error("Scheduled claim notifications or refund updates failed.", error);
    return Response.json({ error: "Reconciliation failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    await reconcileSquareRefunds().catch(error => console.error("Previously requested refund status updates will be retried.", error));
    await deliverPaymentIssueCommunications();
    await deliverPrivacyRequestEmails().catch(caught => console.error("Privacy request emails will be retried separately.", caught));
    await deliverParticipationHoldEmails().catch(caught => console.error("Participation-hold emails will be retried separately.", caught));
    return Response.redirect(new URL("/admin/refunds", request.url), 303);
  } catch (error) {
    console.error("Manual claim notifications or refund updates failed.", error);
    return Response.json({ error: "Reconciliation failed." }, { status: 500 });
  }
}
