import { getCurrentVerifiedPlayer } from "@/lib/player-auth";
import {
  getClubhouseEntryRecord,
  reportPotentialHoleInOne,
} from "@/lib/clubhouse-entry-store";
import { withoutEventCode } from "@/lib/event-code-access";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  const { player, error, status } = await getCurrentVerifiedPlayer();

  if (error || !player) {
    return Response.json({ error }, { status });
  }

  const { entryId } = await context.params;
  const entry = await getClubhouseEntryRecord(entryId);

  if (!entry) {
    return Response.json({ error: "Entry not found." }, { status: 404 });
  }

  if (entry.playerEmail && entry.playerEmail !== player.email) {
    return Response.json(
      { error: "This entry is not linked to your player account." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    isHoleInOne?: unknown;
    simulatorSessionId?: unknown;
    simulatorShotId?: unknown;
    resultOccurredAt?: unknown;
    evidence?: unknown;
  };

  if (body.isHoleInOne !== true) {
    return Response.json(
      { error: "Only an actual simulator-recorded hole-in-one may be reported." },
      { status: 400 },
    );
  }

  const simulatorSessionId =
    typeof body.simulatorSessionId === "string"
      ? body.simulatorSessionId.trim()
      : "";
  const simulatorShotId =
    typeof body.simulatorShotId === "string" ? body.simulatorShotId.trim() : "";
  const evidence = typeof body.evidence === "string" ? body.evidence.trim() : "";
  const resultOccurredAt =
    typeof body.resultOccurredAt === "string"
      ? new Date(body.resultOccurredAt)
      : new Date(Number.NaN);

  try {
    const updatedEntry = await reportPotentialHoleInOne({
      entryId,
      evidence,
      resultOccurredAt,
      simulatorSessionId,
      simulatorShotId,
      sourceMetadata: {
        forwardedFor: request.headers.get("x-forwarded-for") ?? "",
        reportedAt: new Date().toISOString(),
        userAgent: request.headers.get("user-agent") ?? "",
      },
    });

    return Response.json({ entry: withoutEventCode(updatedEntry) });
  } catch (caughtError) {
    return Response.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Could not report the hole-in-one.",
      },
      { status: 400 },
    );
  }
}
