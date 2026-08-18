import { getCurrentVerifiedPlayer } from "@/lib/player-auth";
import {
  getClubhouseEntryRecord,
  updateClubhouseEntryResult,
} from "@/lib/clubhouse-entry-store";

export const dynamic = "force-dynamic";

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

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
    feet?: unknown;
    inches?: unknown;
    evidence?: unknown;
  };
  const feet = Number(body.feet);
  const inches = Number(body.inches);
  const evidence = typeof body.evidence === "string" ? body.evidence.trim() : "";

  if (
    !Number.isFinite(feet) ||
    !Number.isFinite(inches) ||
    feet < 0 ||
    inches < 0
  ) {
    return Response.json(
      { error: "Enter your closest shot distance in feet and inches." },
      { status: 400 },
    );
  }

  try {
    const resultValue = feet * 12 + inches;
    const result = `${formatNumber(feet)} ft ${formatNumber(inches)} in`;
    const updatedEntry = await updateClubhouseEntryResult({
      entryId,
      evidence:
        evidence ||
        "Customer submitted result from Pin2Win access page. Pending simulator verification.",
      result,
      resultStatus: "Needs Review",
      resultUnit: "inches",
      resultValue,
    });

    return Response.json({ entry: updatedEntry });
  } catch (caughtError) {
    return Response.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Could not submit result.",
      },
      { status: 400 },
    );
  }
}
