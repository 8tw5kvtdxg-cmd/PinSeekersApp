import {
  createClubhouseEntryRecord,
  listClubhouseEntryRecords,
} from "@/lib/clubhouse-entry-store";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import { getCurrentVerifiedPlayer } from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const entries = await listClubhouseEntryRecords();

  return Response.json({ entries });
}

export async function POST(request: Request) {
  const { error, status } = await getCurrentVerifiedPlayer();

  if (error) {
    return Response.json({ error }, { status });
  }

  const body = (await request.json()) as {
    challengeSlug?: unknown;
    playerName?: unknown;
    phoneNumber?: unknown;
    e6DisplayName?: unknown;
    locationSlug?: unknown;
    bayName?: unknown;
  };

  try {
    const entry = await createClubhouseEntryRecord({
      challengeSlug:
        typeof body.challengeSlug === "string" ? body.challengeSlug : "",
      playerName: typeof body.playerName === "string" ? body.playerName : "",
      phoneNumber: typeof body.phoneNumber === "string" ? body.phoneNumber : "",
      e6DisplayName:
        typeof body.e6DisplayName === "string" ? body.e6DisplayName : "",
      locationSlug:
        typeof body.locationSlug === "string" ? body.locationSlug : "",
      bayName: typeof body.bayName === "string" ? body.bayName : "",
    });

    return Response.json({ entry }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not create entry." },
      { status: 400 },
    );
  }
}
