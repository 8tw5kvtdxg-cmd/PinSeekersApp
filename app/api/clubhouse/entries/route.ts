import {
  createClubhouseEntryRecord,
  listClubhouseEntryRecords,
} from "@/lib/clubhouse-entry-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await listClubhouseEntryRecords();

  return Response.json({ entries });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    challengeSlug?: unknown;
    playerName?: unknown;
    e6DisplayName?: unknown;
  };

  try {
    const entry = await createClubhouseEntryRecord({
      challengeSlug:
        typeof body.challengeSlug === "string" ? body.challengeSlug : "",
      playerName: typeof body.playerName === "string" ? body.playerName : "",
      e6DisplayName:
        typeof body.e6DisplayName === "string" ? body.e6DisplayName : "",
    });

    return Response.json({ entry }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not create entry." },
      { status: 400 },
    );
  }
}
