import { getCurrentVerifiedPlayer, normalizeEmail } from "@/lib/player-auth";
import { getClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";
import { reportPlayerHoleInOne } from "@/lib/hole-in-one";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const { player, error, status } = await getCurrentVerifiedPlayer();
  if (error || !player) return Response.json({ error }, { status });
  const { entryId } = await context.params;
  const entry = await getClubhouseEntryRecord(entryId);
  if (!entry || entry.archivedAt) return Response.json({ error: "Entry not found." }, { status: 404 });
  if (!entry.playerEmail || normalizeEmail(entry.playerEmail) !== normalizeEmail(player.email)) {
    return Response.json({ error: "This entry is not linked to your player account." }, { status: 403 });
  }
  const limit = await consumeRateLimit({
    namespace: "hole-in-one-player-report", identifier: `${player.id}:${entryId}`,
    limit: 3, windowMs: 60 * 60_000,
  });
  if (!limit.allowed) return rateLimitResponse(limit);
  const body = (await request.json()) as { firstStrokeHoled?: unknown; statement?: unknown };
  if (body.firstStrokeHoled !== true) {
    return Response.json({ error: "Confirm that the simulator recorded the ball holed in one eligible stroke." }, { status: 400 });
  }
  try {
    const report = await reportPlayerHoleInOne({
      entryId, playerId: player.id, statement: body.statement,
    });
    return Response.json({ report: { id: report.id, status: report.status } }, { status: 201 });
  } catch (caughtError) {
    return Response.json({ error: caughtError instanceof Error ? caughtError.message : "Could not report result." }, { status: 400 });
  }
}
