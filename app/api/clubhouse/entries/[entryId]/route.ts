import {
  confirmClubhouseEntryRecord,
  decideClubhouseEntryRecord,
  deleteClubhouseEntryRecord,
  getClubhouseEntryRecord,
  markClubhouseEntryDecisionEmailSent,
  updateClubhouseEntryResult,
} from "@/lib/clubhouse-entry-store";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import { sendEntryDecisionEmails } from "@/lib/entry-decision-email";
import { sendZapierWebhook } from "@/lib/zapier";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await context.params;
  const entry = await getClubhouseEntryRecord(entryId);

  if (!entry) {
    return Response.json({ error: "Entry not found." }, { status: 404 });
  }

  return Response.json({ entry });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const { entryId } = await context.params;
  const body = (await request.json()) as {
    result?: unknown;
    resultValue?: unknown;
    resultUnit?: unknown;
    resultStatus?: unknown;
    evidence?: unknown;
    action?: unknown;
  };

  try {
    if (body.action === "confirm-entry" || body.action === "deny-entry") {
      const decisionStatus =
        body.action === "confirm-entry" ? "Confirmed" : "Denied";
      const entry =
        decisionStatus === "Confirmed"
          ? await confirmClubhouseEntryRecord({
              entryId,
              confirmedBy: "Admin",
            })
          : await decideClubhouseEntryRecord({
              entryId,
              decisionStatus,
              decidedBy: "Admin",
            });

      try {
        await sendEntryDecisionEmails({
          entry,
          decisionStatus,
          request,
        });
      } catch (emailError) {
        return Response.json(
          {
            entry,
            error:
              emailError instanceof Error
                ? `Entry ${decisionStatus.toLowerCase()}, but email failed: ${
                    emailError.message
                  }`
                : `Entry ${decisionStatus.toLowerCase()}, but email failed.`,
          },
          { status: 502 },
        );
      }

      const emailedEntry = await markClubhouseEntryDecisionEmailSent(entryId);

      await sendZapierWebhook(process.env.CUSTOMER_FOLLOWUP_ZAPIER_WEBHOOK_URL, {
        decisionStatus,
        entry: {
          amountCents: emailedEntry.amountCents,
          bayName: emailedEntry.bayName,
          challengeSlug: emailedEntry.challengeSlug,
          entryId: emailedEntry.id,
          locationName: emailedEntry.locationName,
          locationSlug: emailedEntry.locationSlug,
          paymentMethod: emailedEntry.paymentMethod,
          playerEmail: emailedEntry.playerEmail,
          playerName: emailedEntry.playerName,
          validUntil: emailedEntry.validUntil,
        },
        event: "entry_decision",
        followUpType:
          decisionStatus === "Confirmed"
            ? "confirmed_entry_customer_followup"
            : "denied_entry_customer_followup",
        sentAt: new Date().toISOString(),
      });

      return Response.json({ entry: emailedEntry });
    }

    const entry = await updateClubhouseEntryResult({
      entryId,
      result: typeof body.result === "string" ? body.result : "",
      resultValue:
        typeof body.resultValue === "number"
          ? body.resultValue
          : Number(body.resultValue),
      resultUnit: body.resultUnit === "yards" ? "yards" : "inches",
      resultStatus:
        body.resultStatus === "Needs Review" ||
        body.resultStatus === "Verified" ||
        body.resultStatus === "Rejected"
          ? body.resultStatus
          : "Pending E6 Result",
      evidence: typeof body.evidence === "string" ? body.evidence : "",
    });

    return Response.json({ entry });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save result." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const { entryId } = await context.params;
  const deleted = await deleteClubhouseEntryRecord(entryId);

  if (!deleted) {
    return Response.json({ error: "Entry not found." }, { status: 404 });
  }

  return Response.json({ deleted: true, entryId });
}
