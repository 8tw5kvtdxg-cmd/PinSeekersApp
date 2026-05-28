import {
  getClubhousePotSummary,
  getClubhousePotSummaries,
} from "@/lib/clubhouse-entry-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challengeSlug = searchParams.get("challenge");

  if (challengeSlug) {
    const summary = await getClubhousePotSummary(challengeSlug);

    if (!summary) {
      return Response.json({ error: "Challenge not found." }, { status: 404 });
    }

    return Response.json({ summary });
  }

  const summaries = await getClubhousePotSummaries();

  return Response.json({ summaries });
}
