import {
  confirmClubhouseEntryRecord,
  decideClubhouseEntryRecord,
  deleteClubhouseEntryRecord,
  getClubhouseEntryRecord,
  markClubhouseEntryDecisionEmailSent,
  reviewPotentialHoleInOne,
} from "@/lib/clubhouse-entry-store";
import {
  getAdminRequestIdentity,
  isAdminRequestAuthenticated,
} from "@/lib/admin-auth";
import { getCurrentPlayer, normalizeEmail } from "@/lib/player-auth";
import { sendEntryDecisionEmails } from "@/lib/entry-decision-email";
import { sendZapierWebhook } from "@/lib/zapier";
import { withoutEventCode } from "@/lib/event-code-access";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await context.params;
  const entry = await getClubhouseEntryRecord(entryId);

  if (!entry) {
    return Response.json({ error: "Entry not found." }, { status: 404 });
  }

  const isAdmin = await isAdminRequestAuthenticated(request);
  const player = isAdmin ? null : await getCurrentPlayer();
  const isOwner = Boolean(
    player?.email &&
      entry.playerEmail &&
      normalizeEmail(player.email) === normalizeEmail(entry.playerEmail),
  );

  if (!isAdmin && !isOwner) {
    return Response.json({ error: "Entry access denied." }, { status: 403 });
  }

  return Response.json({
    entry: isAdmin ? entry : withoutEventCode(entry),
  });
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
    verificationNote?: unknown;
    chronologyUndeterminable?: unknown;
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

    if (
      body.action !== "verify-hole-in-one" &&
      body.action !== "reject-hole-in-one"
    ) {
      return Response.json(
        { error: "A hole-in-one verification decision is required." },
        { status: 400 },
      );
    }

    const verifier = getAdminRequestIdentity(request);

    if (!verifier) {
      return Response.json({ error: "Admin identity is required." }, { status: 401 });
    }

    const entry = await reviewPotentialHoleInOne({
      chronologyUndeterminable: body.chronologyUndeterminable === true,
      decision: body.action === "verify-hole-in-one" ? "Verified" : "Rejected",
      entryId,
      verificationNote:
        typeof body.verificationNote === "string" ? body.verificationNote : "",
      verifier,
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
  const entry = await getClubhouseEntryRecord(entryId);

  if (entry?.isHoleInOne) {
    return Response.json(
      { error: "Hole-in-one claim records must be retained and cannot be deleted." },
      { status: 409 },
    );
  }

  const deleted = await deleteClubhouseEntryRecord(entryId);

  if (!deleted) {
    return Response.json({ error: "Entry not found." }, { status: 404 });
  }

  return Response.json({ deleted: true, entryId });
}
