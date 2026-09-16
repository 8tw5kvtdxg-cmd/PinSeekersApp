import { reportSimulatorHoleInOne } from "@/lib/hole-in-one";
import { isSimulatorApiSecretAuthenticated, simulatorUnauthorizedResponse } from "@/lib/simulator-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // This endpoint does not accept an administrator cookie as a simulator source.
  if (!isSimulatorApiSecretAuthenticated(request)) return simulatorUnauthorizedResponse();
  const body = (await request.json()) as {
    entryId?: unknown;
    provider?: unknown;
    sessionId?: unknown;
    shotId?: unknown;
    shotAt?: unknown;
    playerAlias?: unknown;
    venueName?: unknown;
    bayName?: unknown;
    evidenceReference?: unknown;
    strokeCount?: unknown;
    ballHoled?: unknown;
    designatedTee?: unknown;
  };
  if (typeof body.entryId !== "string" || !body.entryId.trim()) {
    return Response.json({ error: "Entry ID is required." }, { status: 400 });
  }
  try {
    const report = await reportSimulatorHoleInOne({
      entryId: body.entryId.trim(), provider: body.provider,
      sessionId: body.sessionId, shotId: body.shotId, shotAt: body.shotAt,
      playerAlias: body.playerAlias, venueName: body.venueName, bayName: body.bayName,
      evidenceReference: body.evidenceReference, strokeCount: body.strokeCount,
      ballHoled: body.ballHoled, designatedTee: body.designatedTee,
    });
    return Response.json({ report: { id: report.id, status: report.status } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not ingest simulator shot." }, { status: 400 });
  }
}
