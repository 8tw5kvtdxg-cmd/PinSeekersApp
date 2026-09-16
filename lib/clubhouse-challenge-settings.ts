import { clubhouseChallenges, getClubhouseChallenge } from "@/lib/clubhouse";
import { Prisma } from "@/app/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export type ClubhouseChallengeSettingView = {
  challengeSlug: string;
  e6EventCode: string;
  startsAt: string;
  endsAt: string;
};

function toInputValue(date: Date | string | null | undefined) {
  if (!date) {
    return "";
  }

  const value = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  const localValue = new Date(
    value.getTime() - value.getTimezoneOffset() * 60 * 1000,
  );

  return localValue.toISOString().slice(0, 16);
}

function parseDateTimeInput(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Event timing must be a valid date and time.");
  }

  return date;
}

export async function listClubhouseChallengeSettings() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return clubhouseChallenges.map<ClubhouseChallengeSettingView>((challenge) => ({
      challengeSlug: challenge.slug,
      e6EventCode: challenge.e6JoinCode,
      startsAt: toInputValue(challenge.startsAt),
      endsAt: toInputValue(challenge.endsAt),
    }));
  }

  const savedSettings = await prisma.clubhouseChallengeSetting.findMany();
  const settingsBySlug = new Map(
    savedSettings.map((setting) => [setting.challengeSlug, setting]),
  );

  return clubhouseChallenges.map<ClubhouseChallengeSettingView>((challenge) => {
    const setting = settingsBySlug.get(challenge.slug);

    return {
      challengeSlug: challenge.slug,
      e6EventCode: setting?.e6EventCode ?? challenge.e6JoinCode,
      startsAt: toInputValue(setting?.startsAt ?? challenge.startsAt),
      endsAt: toInputValue(setting?.endsAt ?? challenge.endsAt),
    };
  });
}

export async function getClubhouseChallengeSetting(challengeSlug: string) {
  const challenge = getClubhouseChallenge(challengeSlug);

  if (!challenge) {
    return null;
  }

  const settings = await listClubhouseChallengeSettings();

  return (
    settings.find((setting) => setting.challengeSlug === challenge.slug) ?? null
  );
}

export async function getClubhouseEventCode(challengeSlug: string) {
  const setting = await getClubhouseChallengeSetting(challengeSlug);
  const challenge = getClubhouseChallenge(challengeSlug);

  return setting?.e6EventCode || challenge?.e6JoinCode || null;
}

export async function updateClubhouseChallengeSetting(input: {
  challengeSlug: string;
  e6EventCode: unknown;
  startsAt: unknown;
  endsAt: unknown;
}) {
  const challenge = getClubhouseChallenge(input.challengeSlug);

  if (!challenge) {
    throw new Error("Challenge not found.");
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const e6EventCode =
    typeof input.e6EventCode === "string" ? input.e6EventCode.trim() : "";

  if (!e6EventCode) {
    throw new Error("Simulator event code is required.");
  }

  const startsAt = parseDateTimeInput(input.startsAt);
  const endsAt = parseDateTimeInput(input.endsAt);

  if (startsAt && endsAt && startsAt >= endsAt) {
    throw new Error("Event end must be after the start.");
  }

  const setting = await prisma.$transaction(async (tx) => {
    const [previous, unresolvedReports] = await Promise.all([
      tx.clubhouseChallengeSetting.findUnique({ where: { challengeSlug: challenge.slug } }),
      tx.holeInOneReport.count({
        where: { challengeSlug: challenge.slug, status: { in: ["Pending Review", "Verified"] } },
      }),
    ]);
    if (unresolvedReports) {
      if ((previous?.e6EventCode ?? challenge.e6JoinCode) !== e6EventCode) {
        throw new Error("Event code cannot change while a potential or verified hole-in-one exists.");
      }
      if (
        (previous?.startsAt && previous.startsAt.getTime() !== startsAt?.getTime()) ||
        (previous?.endsAt && previous.endsAt.getTime() !== endsAt?.getTime())
      ) {
        throw new Error("Configured challenge dates cannot change while a potential or verified hole-in-one exists.");
      }
    }
    return tx.clubhouseChallengeSetting.upsert({
      where: { challengeSlug: challenge.slug },
      update: { e6EventCode, startsAt, endsAt },
      create: { challengeSlug: challenge.slug, e6EventCode, startsAt, endsAt },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return {
    challengeSlug: setting.challengeSlug,
    e6EventCode: setting.e6EventCode ?? challenge.e6JoinCode,
    startsAt: toInputValue(setting.startsAt),
    endsAt: toInputValue(setting.endsAt),
  };
}
