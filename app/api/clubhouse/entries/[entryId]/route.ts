import { getClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";

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
