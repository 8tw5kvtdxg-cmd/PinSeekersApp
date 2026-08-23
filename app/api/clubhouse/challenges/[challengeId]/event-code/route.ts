import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import {
  getClubhouseChallengeSetting,
  updateClubhouseChallengeSetting,
} from "@/lib/clubhouse-challenge-settings";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ challengeId: string }> },
) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const { challengeId } = await context.params;
  const setting = await getClubhouseChallengeSetting(challengeId);

  if (!setting) {
    return Response.json({ error: "Challenge not found." }, { status: 404 });
  }

  return Response.json({
    challengeId: setting.challengeSlug,
    eventCode: setting.e6EventCode,
    startsAt: setting.startsAt,
    endsAt: setting.endsAt,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ challengeId: string }> },
) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const { challengeId } = await context.params;
  const body = (await request.json()) as {
    eventCode?: unknown;
    startsAt?: unknown;
    endsAt?: unknown;
  };

  try {
    const setting = await updateClubhouseChallengeSetting({
      challengeSlug: challengeId,
      e6EventCode: body.eventCode,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
    });

    return Response.json({
      challengeId: setting.challengeSlug,
      eventCode: setting.e6EventCode,
      startsAt: setting.startsAt,
      endsAt: setting.endsAt,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update challenge settings.",
      },
      { status: 400 },
    );
  }
}
