import { challengeSaleError } from "@/lib/challenge-readiness-policy";
import { getClubhouseChallenge } from "@/lib/clubhouse";
import { getPrismaClient } from "@/lib/prisma";

export const alamoPosterChallengeId = "alamo-closest-pin-monthly";
export const alamoPosterLocation = "alamo-golf-den";
export const alamoPosterBayName = "Bay 1";

export async function findAlamoPosterBay() {
  return getPrismaClient()?.bay.findFirst({
    where: { name: alamoPosterBayName, location: { slug: alamoPosterLocation } },
    include: { location: true },
  });
}

export function bayEntryPath(id: string) {
  return `/play/bay?${new URLSearchParams({ id })}`;
}

export async function resolveBayEntry(id: string) {
  const prisma = getPrismaClient();
  const bay = await prisma?.bay.findUnique({
    where: { id },
    include: { location: true, clubhouseAssignments: true },
  });

  if (!bay?.isActive || !bay.location.isActive) {
    return {
      bay: null,
      current: null,
      blockers: [!prisma ? "Database is unavailable." : !bay ? "Bay was not found." :
        !bay.location.isActive ? "The venue is inactive." : "The bay is inactive."],
    };
  }

  const slugs = bay.clubhouseAssignments.map(({ challengeSlug }) => challengeSlug);
  const settings = await prisma!.clubhouseChallengeSetting.findMany({
    where: { challengeSlug: { in: slugs } },
    orderBy: [{ startsAt: "desc" }, { challengeSlug: "asc" }],
  });
  const now = new Date();
  const blockers: string[] = [];

  for (const setting of settings) {
    const challenge = getClubhouseChallenge(setting.challengeSlug);
    const error = challengeSaleError(setting, now);
    if (challenge && !error) {
      const query = new URLSearchParams({ location: bay.location.slug, bay: bay.name });
      const path = `/play/${encodeURIComponent(setting.challengeSlug)}?${query}`;
      return { bay, current: { challenge, setting, path }, blockers: [] };
    }
    blockers.push(`${challenge?.name ?? setting.challengeSlug} — ${error ?? "Unknown challenge."}`);
  }

  for (const slug of slugs) {
    if (!settings.some((setting) => setting.challengeSlug === slug)) {
      blockers.push(`${getClubhouseChallenge(slug)?.name ?? slug} — challenge setup is missing.`);
    }
  }
  if (!slugs.length) blockers.push("No challenge is assigned to this bay.");
  return { bay, current: null, blockers };
}
