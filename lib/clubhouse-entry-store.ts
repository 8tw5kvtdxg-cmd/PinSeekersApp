import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ClubhouseEntry } from "@/lib/clubhouse";
import {
  getClubhouseChallenge,
  normalizeChallengeSlug,
} from "@/lib/clubhouse";
import {
  getClubhouseChallengeSetting,
  getClubhouseEventCode,
} from "@/lib/clubhouse-challenge-settings";
import {
  getBookingVerificationRecord,
  updateBookingVerificationStatus,
} from "@/lib/booking-verification-store";
import { slugifyLocation } from "@/lib/location-utils";
import { getPrismaClient } from "@/lib/prisma";
import { selectHoleInOneWinnerIds } from "@/lib/hole-in-one";

export type ClubhouseEntryRecord = ClubhouseEntry & {
  e6EventCode: string;
  playerEmail?: string;
  stripeCheckoutSessionId?: string;
  payarcCheckoutId?: string;
  payarcOrderId?: string;
  squareCheckoutId?: string;
  squareOrderId?: string;
  squarePaymentId?: string;
  venueBookingReference?: string;
  bookingVerificationId?: string;
  bookingVerificationStatus?: "Pending Match" | "Auto Verified" | "Needs Review";
  paymentMethod: "Stripe" | "Venue booking" | "Payarc" | "Square";
  locationSlug: string;
  locationName: string;
  bayName?: string;
  amountCents: number;
  adminConfirmedAt?: string;
  adminConfirmedBy?: string;
  entryDecisionStatus?: "Confirmed" | "Denied";
  entryDecisionAt?: string;
  entryDecisionBy?: string;
  entryDecisionEmailSentAt?: string;
  isHoleInOne?: boolean;
  simulatorSessionId?: string;
  simulatorShotId?: string;
  resultOccurredAt?: string;
  resultSource?: string;
  resultSourceMetadata?: Record<string, string>;
  resultVerifiedAt?: string;
  resultVerifiedBy?: string;
  resultVerificationNote?: string;
  closureRefundEligibleAt?: string;
  closureRefundReason?: string;
  refundStatus?: string;
  refundedAmountCents: number;
  squareRefundId?: string;
  refundRequestedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClubhouseLeaderboardRow = {
  rank: number;
  entryId: string;
  playerName: string;
  e6DisplayName: string;
  challengeSlug: string;
  result: string;
  resultValue: number;
  resultUnit: "inches" | "yards";
  paidAt: string;
  resultStatus: ClubhouseEntryRecord["resultStatus"];
  resultOccurredAt?: string;
  isWinner: boolean;
};

const entriesPath = path.join(process.cwd(), ".pin2win-clubhouse-entries.json");
async function readJsonObject<T extends Record<string, unknown>>(
  filePath: string,
): Promise<T> {
  try {
    const file = await readFile(filePath, "utf8");
    const parsed = JSON.parse(file) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {} as T;
    }

    return parsed as T;
  } catch {
    return {} as T;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function toClubhouseEntryRecord(entry: {
  id: string;
  challengeSlug: string;
  playerName: string;
  playerEmail: string | null;
  phoneNumber: string | null;
  e6DisplayName: string;
  paymentStatus: string;
  paidAt: string;
  validFrom: string;
  validUntil: string;
  attemptLimit: number;
  resultStatus: string;
  result: string | null;
  resultValue: number | null;
  resultUnit: string | null;
  evidence: string | null;
  isHoleInOne: boolean | null;
  simulatorSessionId: string | null;
  simulatorShotId: string | null;
  resultOccurredAt: Date | null;
  resultSource: string | null;
  resultSourceMetadata: unknown;
  resultVerifiedAt: Date | null;
  resultVerifiedBy: string | null;
  resultVerificationNote: string | null;
  closureRefundEligibleAt: Date | null;
  closureRefundReason: string | null;
  refundStatus: string | null;
  refundedAmountCents: number;
  squareRefundId: string | null;
  refundRequestedAt: Date | null;
  refundedAt: Date | null;
  e6EventCode: string;
  stripeCheckoutSessionId: string | null;
  payarcCheckoutId: string | null;
  payarcOrderId: string | null;
  squareCheckoutId: string | null;
  squareOrderId: string | null;
  squarePaymentId: string | null;
  venueBookingReference: string | null;
  bookingVerificationId: string | null;
  bookingVerificationStatus: string | null;
  paymentMethod: string;
  locationSlug: string;
  locationName: string;
  bayName: string | null;
  amountCents: number;
  adminConfirmedAt: string | null;
  adminConfirmedBy: string | null;
  entryDecisionStatus: string | null;
  entryDecisionAt: string | null;
  entryDecisionBy: string | null;
  entryDecisionEmailSentAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ClubhouseEntryRecord {
  return {
    id: entry.id,
    challengeSlug: entry.challengeSlug,
    playerName: entry.playerName,
    playerEmail: entry.playerEmail ?? undefined,
    phoneNumber: entry.phoneNumber ?? undefined,
    e6DisplayName: entry.e6DisplayName,
    paymentStatus: entry.paymentStatus as ClubhouseEntryRecord["paymentStatus"],
    paidAt: entry.paidAt,
    validFrom: entry.validFrom,
    validUntil: entry.validUntil,
    attemptLimit: entry.attemptLimit,
    resultStatus: entry.resultStatus as ClubhouseEntryRecord["resultStatus"],
    result: entry.result ?? undefined,
    resultValue: entry.resultValue ?? undefined,
    resultUnit: entry.resultUnit as ClubhouseEntryRecord["resultUnit"],
    evidence: entry.evidence ?? undefined,
    isHoleInOne: entry.isHoleInOne ?? undefined,
    simulatorSessionId: entry.simulatorSessionId ?? undefined,
    simulatorShotId: entry.simulatorShotId ?? undefined,
    resultOccurredAt: entry.resultOccurredAt?.toISOString(),
    resultSource: entry.resultSource ?? undefined,
    resultSourceMetadata:
      entry.resultSourceMetadata && typeof entry.resultSourceMetadata === "object"
        ? (entry.resultSourceMetadata as Record<string, string>)
        : undefined,
    resultVerifiedAt: entry.resultVerifiedAt?.toISOString(),
    resultVerifiedBy: entry.resultVerifiedBy ?? undefined,
    resultVerificationNote: entry.resultVerificationNote ?? undefined,
    closureRefundEligibleAt: entry.closureRefundEligibleAt?.toISOString(),
    closureRefundReason: entry.closureRefundReason ?? undefined,
    refundStatus: entry.refundStatus ?? undefined,
    refundedAmountCents: entry.refundedAmountCents,
    squareRefundId: entry.squareRefundId ?? undefined,
    refundRequestedAt: entry.refundRequestedAt?.toISOString(),
    refundedAt: entry.refundedAt?.toISOString(),
    e6EventCode: entry.e6EventCode,
    stripeCheckoutSessionId: entry.stripeCheckoutSessionId ?? undefined,
    payarcCheckoutId: entry.payarcCheckoutId ?? undefined,
    payarcOrderId: entry.payarcOrderId ?? undefined,
    squareCheckoutId: entry.squareCheckoutId ?? undefined,
    squareOrderId: entry.squareOrderId ?? undefined,
    squarePaymentId: entry.squarePaymentId ?? undefined,
    venueBookingReference: entry.venueBookingReference ?? undefined,
    bookingVerificationId: entry.bookingVerificationId ?? undefined,
    bookingVerificationStatus:
      entry.bookingVerificationStatus as ClubhouseEntryRecord["bookingVerificationStatus"],
    paymentMethod: entry.paymentMethod as ClubhouseEntryRecord["paymentMethod"],
    locationSlug: entry.locationSlug,
    locationName: entry.locationName,
    bayName: entry.bayName ?? undefined,
    amountCents: entry.amountCents,
    adminConfirmedAt: entry.adminConfirmedAt ?? undefined,
    adminConfirmedBy: entry.adminConfirmedBy ?? undefined,
    entryDecisionStatus:
      entry.entryDecisionStatus as ClubhouseEntryRecord["entryDecisionStatus"],
    entryDecisionAt: entry.entryDecisionAt ?? undefined,
    entryDecisionBy: entry.entryDecisionBy ?? undefined,
    entryDecisionEmailSentAt: entry.entryDecisionEmailSentAt ?? undefined,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export async function listClubhouseEntryRecords() {
  const prisma = getPrismaClient();

  if (prisma) {
    const entries = await prisma.clubhouseEntryRecord.findMany({
      orderBy: { createdAt: "desc" },
    });

    return entries.map(toClubhouseEntryRecord);
  }

  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );

  return Object.values(entries).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listClubhouseEntryRecordsForChallenge(challengeSlug: string) {
  const normalizedSlug = normalizeChallengeSlug(challengeSlug);
  const entries = await listClubhouseEntryRecords();

  return entries.filter(
    (entry) => normalizeChallengeSlug(entry.challengeSlug) === normalizedSlug,
  );
}

export async function getClubhouseLocationRevenueSummaries() {
  const entries = await listClubhouseEntryRecords();

  return entries
    .filter((entry) => entry.paymentStatus === "Succeeded")
    .reduce<
      Record<
        string,
        {
          locationSlug: string;
          locationName: string;
          entryCount: number;
          revenueCents: number;
          latestPaidAt: string;
        }
      >
    >((summaries, entry) => {
      const challenge = getClubhouseChallenge(entry.challengeSlug);
      const locationName = entry.locationName || challenge?.venue || "Unknown";
      const locationSlug =
        entry.locationSlug || slugifyLocation(locationName) || "unknown";
      const amountCents = entry.amountCents ?? challenge?.entryFeeCents ?? 0;
      const current = summaries[locationSlug];

      summaries[locationSlug] = {
        locationSlug,
        locationName,
        entryCount: (current?.entryCount ?? 0) + 1,
        revenueCents: (current?.revenueCents ?? 0) + amountCents,
        latestPaidAt: current?.latestPaidAt ?? entry.createdAt,
      };

      return summaries;
    }, {});
}

export async function listClubhouseEntryRecordsForLocation(locationSlug: string) {
  const normalizedLocationSlug = slugifyLocation(locationSlug);
  const entries = await listClubhouseEntryRecords();

  return entries.filter((entry) => {
    const challenge = getClubhouseChallenge(entry.challengeSlug);
    const entryLocationSlug =
      entry.locationSlug ||
      slugifyLocation(entry.locationName || challenge?.venue || "");

    return entryLocationSlug === normalizedLocationSlug;
  });
}

export async function getClubhouseEntryRecord(entryId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    const entry = await prisma.clubhouseEntryRecord.findUnique({
      where: { id: entryId },
    });

    return entry ? toClubhouseEntryRecord(entry) : null;
  }

  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );

  return entries[entryId] ?? null;
}

export async function updateClubhouseEntryResult(input: {
  entryId: string;
  result: string;
  resultValue: number;
  resultUnit: "inches" | "yards";
  resultStatus: ClubhouseEntryRecord["resultStatus"];
  evidence?: string;
}) {
  const result = input.result.trim();

  if (!result) {
    throw new Error("Result display value is required.");
  }

  if (!Number.isFinite(input.resultValue) || input.resultValue < 0) {
    throw new Error("Result sort value must be a positive number.");
  }

  const prisma = getPrismaClient();

  if (prisma) {
    const existing = await prisma.clubhouseEntryRecord.findUnique({
      where: { id: input.entryId },
    });

    if (!existing) {
      throw new Error("Entry not found.");
    }

    const updated = await prisma.clubhouseEntryRecord.update({
      data: {
        evidence: input.evidence?.trim() || null,
        result,
        resultStatus: input.resultStatus,
        resultUnit: input.resultUnit,
        resultValue: input.resultValue,
        updatedAt: new Date(),
      },
      where: { id: input.entryId },
    });

    return toClubhouseEntryRecord(updated);
  }

  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );
  const entry = entries[input.entryId];

  if (!entry) {
    throw new Error("Entry not found.");
  }

  const updatedEntry: ClubhouseEntryRecord = {
    ...entry,
    result,
    resultValue: input.resultValue,
    resultUnit: input.resultUnit,
    resultStatus: input.resultStatus,
    evidence: input.evidence?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  entries[input.entryId] = updatedEntry;
  await writeJson(entriesPath, entries);

  return updatedEntry;
}

export async function reportPotentialHoleInOne(input: {
  entryId: string;
  simulatorSessionId: string;
  simulatorShotId: string;
  resultOccurredAt: Date;
  evidence: string;
  sourceMetadata: Record<string, string>;
}) {
  const simulatorSessionId = input.simulatorSessionId.trim();
  const simulatorShotId = input.simulatorShotId.trim();
  const evidence = input.evidence.trim();

  if (!simulatorSessionId || !simulatorShotId) {
    throw new Error("Simulator session ID and shot ID are required.");
  }

  if (Number.isNaN(input.resultOccurredAt.getTime())) {
    throw new Error("The simulator source timestamp is invalid.");
  }

  if (input.resultOccurredAt.getTime() > Date.now() + 5 * 60 * 1000) {
    throw new Error("The simulator source timestamp cannot be in the future.");
  }

  if (!evidence) {
    throw new Error("Evidence or an evidence reference is required.");
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database access is required to safely report a hole-in-one.");
  }

  return prisma.$transaction(
    async (transaction) => {
      const existing = await transaction.clubhouseEntryRecord.findUnique({
        where: { id: input.entryId },
      });

      if (!existing) {
        throw new Error("Entry not found.");
      }

      if (existing.paymentStatus !== "Succeeded") {
        throw new Error("Only a paid entry can report a hole-in-one.");
      }

      if (existing.isHoleInOne !== null) {
        throw new Error("A result has already been submitted for this entry.");
      }

      const setting = await transaction.clubhouseChallengeSetting.findUnique({
        where: { challengeSlug: existing.challengeSlug },
      });

      if (setting?.status === "CLOSED") {
        throw new Error("This challenge is already closed.");
      }

      const now = new Date();
      const updated = await transaction.clubhouseEntryRecord.update({
        data: {
          evidence,
          isHoleInOne: true,
          result: "Hole-in-one reported",
          resultOccurredAt: input.resultOccurredAt,
          resultSource: "CUSTOMER_SIMULATOR_REPORT",
          resultSourceMetadata: input.sourceMetadata,
          resultStatus: "Needs Review",
          resultUnit: null,
          resultValue: null,
          simulatorSessionId,
          simulatorShotId,
        },
        where: { id: input.entryId },
      });

      await transaction.clubhouseChallengeSetting.upsert({
        create: {
          challengeSlug: existing.challengeSlug,
          pausedAt: now,
          potentialWinnerReportedAt: now,
          status: "PAUSED",
        },
        update: {
          pausedAt: setting?.pausedAt ?? now,
          potentialWinnerReportedAt: setting?.potentialWinnerReportedAt ?? now,
          status: "PAUSED",
        },
        where: { challengeSlug: existing.challengeSlug },
      });

      await transaction.holeInOneVerificationEvent.create({
        data: {
          action: "POTENTIAL_HOLE_IN_ONE_REPORTED",
          actorIdentifier: existing.playerEmail,
          actorType: "PLAYER",
          challengeSlug: existing.challengeSlug,
          entryId: existing.id,
          evidence,
          isHoleInOne: true,
          resultOccurredAt: input.resultOccurredAt,
          sourceMetadata: input.sourceMetadata,
        },
      });

      return toClubhouseEntryRecord(updated);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function reviewPotentialHoleInOne(input: {
  entryId: string;
  decision: "Verified" | "Rejected";
  verifier: string;
  verificationNote: string;
  chronologyUndeterminable?: boolean;
}) {
  const verifier = input.verifier.trim();
  const verificationNote = input.verificationNote.trim();

  if (!verifier || !verificationNote) {
    throw new Error("An authorized verifier and verification note are required.");
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database access is required to safely verify a hole-in-one.");
  }

  return prisma.$transaction(
    async (transaction) => {
      const existing = await transaction.clubhouseEntryRecord.findUnique({
        where: { id: input.entryId },
      });

      if (!existing || existing.isHoleInOne !== true) {
        throw new Error("A pending hole-in-one claim was not found.");
      }

      if (
        !existing.simulatorSessionId ||
        !existing.simulatorShotId ||
        !existing.resultOccurredAt ||
        !existing.evidence
      ) {
        throw new Error(
          "Session ID, shot ID, source timestamp, and evidence are required before verification.",
        );
      }

      const setting = await transaction.clubhouseChallengeSetting.findUnique({
        where: { challengeSlug: existing.challengeSlug },
      });

      if (setting?.status === "CLOSED") {
        throw new Error("The challenge already has an approved winner decision.");
      }

      const now = new Date();
      const updated = await transaction.clubhouseEntryRecord.update({
        data: {
          result: input.decision === "Verified" ? "Verified hole-in-one" : "Rejected hole-in-one claim",
          resultStatus: input.decision,
          resultVerificationNote: verificationNote,
          resultVerifiedAt: now,
          resultVerifiedBy: verifier,
        },
        where: { id: input.entryId },
      });

      await transaction.holeInOneVerificationEvent.create({
        data: {
          action:
            input.decision === "Verified"
              ? "HOLE_IN_ONE_VERIFIED"
              : "HOLE_IN_ONE_REJECTED",
          actorIdentifier: verifier,
          actorType: "ADMIN",
          challengeSlug: existing.challengeSlug,
          entryId: existing.id,
          evidence: existing.evidence,
          isHoleInOne: input.decision === "Verified",
          resultOccurredAt: existing.resultOccurredAt,
          sourceMetadata: existing.resultSourceMetadata ?? undefined,
          verificationNote,
        },
      });

      const remainingClaims = await transaction.clubhouseEntryRecord.count({
        where: {
          challengeSlug: existing.challengeSlug,
          isHoleInOne: true,
          resultStatus: "Needs Review",
        },
      });

      if (remainingClaims > 0) {
        return toClubhouseEntryRecord(updated);
      }

      const verifiedCandidates = await transaction.clubhouseEntryRecord.findMany({
        where: {
          challengeSlug: existing.challengeSlug,
          isHoleInOne: true,
          resultStatus: "Verified",
        },
      });

      if (verifiedCandidates.length === 0) {
        if (input.decision === "Rejected") {
          await transaction.clubhouseChallengeSetting.updateMany({
            data: {
              pausedAt: null,
              potentialWinnerReportedAt: null,
              status: "ACTIVE",
            },
            where: {
              challengeSlug: existing.challengeSlug,
              status: "PAUSED",
            },
          });
        }

        return toClubhouseEntryRecord(updated);
      }
      const winnerEntryIds = selectHoleInOneWinnerIds(
        verifiedCandidates,
        input.chronologyUndeterminable === true,
      );

      await transaction.clubhouseChallengeSetting.upsert({
        create: {
          challengeSlug: existing.challengeSlug,
          closedAt: now,
          closureReason: "Verified hole-in-one",
          status: "CLOSED",
          winnerEntryIds,
          winnerSelectedAt: now,
        },
        update: {
          closedAt: now,
          closureReason: "Verified hole-in-one",
          status: "CLOSED",
          winnerEntryIds,
          winnerSelectedAt: now,
        },
        where: { challengeSlug: existing.challengeSlug },
      });

      const challenge = getClubhouseChallenge(existing.challengeSlug);
      const createdAfter = new Date(
        now.getTime() - (challenge?.playWindowMinutes ?? 15) * 60 * 1000,
      );

      await transaction.clubhouseEntryRecord.updateMany({
        data: {
          closureRefundEligibleAt: now,
          closureRefundReason:
            "Challenge closed before the paid attempt window could be completed. Refund review required.",
        },
        where: {
          challengeSlug: existing.challengeSlug,
          createdAt: { gt: createdAfter },
          id: { notIn: winnerEntryIds },
          paymentStatus: "Succeeded",
          resultStatus: "Pending E6 Result",
        },
      });

      await transaction.holeInOneVerificationEvent.create({
        data: {
          action: "WINNER_SELECTED_AND_CHALLENGE_CLOSED",
          actorIdentifier: verifier,
          actorType: "ADMIN",
          challengeSlug: existing.challengeSlug,
          entryId: existing.id,
          isHoleInOne: true,
          resultOccurredAt: existing.resultOccurredAt,
          sourceMetadata: {
            chronologyUndeterminable: input.chronologyUndeterminable === true,
            winnerEntryIds,
          },
          verificationNote,
        },
      });

      return toClubhouseEntryRecord(updated);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function confirmClubhouseEntryRecord(input: {
  entryId: string;
  confirmedBy?: string;
}) {
  return decideClubhouseEntryRecord({
    entryId: input.entryId,
    decisionStatus: "Confirmed",
    decidedBy: input.confirmedBy,
  });
}

export async function decideClubhouseEntryRecord(input: {
  entryId: string;
  decisionStatus: "Confirmed" | "Denied";
  decidedBy?: string;
}) {
  const prisma = getPrismaClient();

  if (prisma) {
    const entry = await prisma.clubhouseEntryRecord.findUnique({
      where: { id: input.entryId },
    });

    if (!entry) {
      throw new Error("Entry not found.");
    }

    const now = new Date();
    const decidedBy = input.decidedBy?.trim() || "Admin";
    const updated = await prisma.clubhouseEntryRecord.update({
      data: {
        adminConfirmedAt:
          input.decisionStatus === "Confirmed" ? formatDisplayDate(now) : null,
        adminConfirmedBy:
          input.decisionStatus === "Confirmed" ? decidedBy : null,
        entryDecisionAt: formatDisplayDate(now),
        entryDecisionBy: decidedBy,
        entryDecisionEmailSentAt: null,
        entryDecisionStatus: input.decisionStatus,
        updatedAt: now,
      },
      where: { id: input.entryId },
    });

    return toClubhouseEntryRecord(updated);
  }

  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );
  const entry = entries[input.entryId];

  if (!entry) {
    throw new Error("Entry not found.");
  }

  const now = new Date();
  const decidedBy = input.decidedBy?.trim() || "Admin";
  const updatedEntry: ClubhouseEntryRecord = {
    ...entry,
    adminConfirmedAt:
      input.decisionStatus === "Confirmed" ? formatDisplayDate(now) : undefined,
    adminConfirmedBy: input.decisionStatus === "Confirmed" ? decidedBy : undefined,
    entryDecisionStatus: input.decisionStatus,
    entryDecisionAt: formatDisplayDate(now),
    entryDecisionBy: decidedBy,
    entryDecisionEmailSentAt: undefined,
    updatedAt: now.toISOString(),
  };

  entries[input.entryId] = updatedEntry;
  await writeJson(entriesPath, entries);

  return updatedEntry;
}

export async function markClubhouseEntryDecisionEmailSent(entryId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    const updated = await prisma.clubhouseEntryRecord.update({
      data: {
        entryDecisionEmailSentAt: formatDisplayDate(new Date()),
        updatedAt: new Date(),
      },
      where: { id: entryId },
    });

    return toClubhouseEntryRecord(updated);
  }

  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );
  const entry = entries[entryId];

  if (!entry) {
    throw new Error("Entry not found.");
  }

  const now = new Date();
  const updatedEntry: ClubhouseEntryRecord = {
    ...entry,
    entryDecisionEmailSentAt: formatDisplayDate(now),
    updatedAt: now.toISOString(),
  };

  entries[entryId] = updatedEntry;
  await writeJson(entriesPath, entries);

  return updatedEntry;
}

export async function deleteClubhouseEntryRecord(entryId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      await prisma.clubhouseEntryRecord.delete({
        where: { id: entryId },
      });

      return true;
    } catch {
      return false;
    }
  }

  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );

  if (!entries[entryId]) {
    return false;
  }

  delete entries[entryId];
  await writeJson(entriesPath, entries);

  return true;
}

export async function getClubhouseLeaderboardRows(challengeSlug: string) {
  const normalizedSlug = normalizeChallengeSlug(challengeSlug);
  const challenge = getClubhouseChallenge(normalizedSlug);
  const entries = await listClubhouseEntryRecordsForChallenge(normalizedSlug);
  const setting = await getClubhouseChallengeSetting(normalizedSlug);
  const winnerIds = new Set(setting?.winnerEntryIds ?? []);
  const eligibleEntries = entries.filter(
    (entry) =>
      entry.paymentStatus === "Succeeded" &&
      entry.resultStatus === "Verified" &&
      (challenge?.type !== "HOLE_IN_ONE" || entry.isHoleInOne === true),
  );
  const sortedEntries = eligibleEntries.sort((a, b) => {
    if (challenge?.type === "HOLE_IN_ONE") {
      return (
        new Date(a.resultOccurredAt ?? 0).getTime() -
        new Date(b.resultOccurredAt ?? 0).getTime()
      );
    }

    return (b.resultValue ?? 0) - (a.resultValue ?? 0);
  });

  return sortedEntries.map<ClubhouseLeaderboardRow>((entry, index) => ({
    rank: index + 1,
    entryId: entry.id,
    playerName: entry.playerName,
    e6DisplayName: entry.e6DisplayName,
    challengeSlug: normalizeChallengeSlug(entry.challengeSlug),
    result: entry.result ?? "",
    resultValue: entry.resultValue ?? 0,
    resultUnit: entry.resultUnit ?? (challenge?.type === "HOLE_IN_ONE" ? "inches" : "yards"),
    paidAt: entry.paidAt,
    resultStatus: entry.resultStatus,
    resultOccurredAt: entry.resultOccurredAt,
    isWinner: winnerIds.has(entry.id),
  }));
}

export async function getClubhouseEntryRecordByStripeSessionId(
  stripeCheckoutSessionId: string,
) {
  const prisma = getPrismaClient();

  if (prisma) {
    const entry = await prisma.clubhouseEntryRecord.findUnique({
      where: { stripeCheckoutSessionId },
    });

    return entry ? toClubhouseEntryRecord(entry) : null;
  }

  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );

  return (
    Object.values(entries).find(
      (entry) => entry.stripeCheckoutSessionId === stripeCheckoutSessionId,
    ) ?? null
  );
}

export async function getClubhouseEntryRecordByPayarcCheckoutId(
  payarcCheckoutId: string,
) {
  const prisma = getPrismaClient();

  if (prisma) {
    const entry = await prisma.clubhouseEntryRecord.findUnique({
      where: { payarcCheckoutId },
    });

    return entry ? toClubhouseEntryRecord(entry) : null;
  }

  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );

  return (
    Object.values(entries).find(
      (entry) => entry.payarcCheckoutId === payarcCheckoutId,
    ) ?? null
  );
}

function formatEntryDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export async function getClubhouseEntryRecordBySquareCheckoutId(
  squareCheckoutId: string,
) {
  const prisma = getPrismaClient();

  if (prisma) {
    const entry = await prisma.clubhouseEntryRecord.findUnique({
      where: { squareCheckoutId },
    });

    return entry ? toClubhouseEntryRecord(entry) : null;
  }

  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );

  return (
    Object.values(entries).find(
      (entry) => entry.squareCheckoutId === squareCheckoutId,
    ) ?? null
  );
}

function nextEntryId(entries: Array<{ id: string }>, now: Date) {
  const dateKey = formatEntryDate(now);
  const currentMax = entries.reduce((max, entry) => {
    const prefix = `P2W-ENTRY-${dateKey}-`;

    if (!entry.id.startsWith(prefix)) {
      return max;
    }

    const sequence = Number(entry.id.slice(prefix.length));

    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);

  return `P2W-ENTRY-${dateKey}-${String(currentMax + 1).padStart(4, "0")}`;
}

export async function createClubhouseEntryRecord(input: {
  challengeSlug: string;
  playerName: string;
  playerEmail?: string;
  phoneNumber: string;
  e6DisplayName: string;
  stripeCheckoutSessionId?: string;
  payarcCheckoutId?: string;
  payarcOrderId?: string;
  squareCheckoutId?: string;
  squareOrderId?: string;
  squarePaymentId?: string;
  venueBookingReference?: string;
  bookingVerificationId?: string;
  locationSlug?: string;
  locationName?: string;
  bayName?: string;
}) {
  const challenge = getClubhouseChallenge(input.challengeSlug);

  if (!challenge) {
    throw new Error("Challenge not found.");
  }

  const playerName = input.playerName.trim();
  const phoneNumber = input.phoneNumber.trim();
  const e6DisplayName = input.e6DisplayName.trim();

  if (!playerName || !phoneNumber || !e6DisplayName) {
    throw new Error("Player name, phone number, and simulator account name are required.");
  }

  const normalizedChallengeSlug = normalizeChallengeSlug(input.challengeSlug);
  const locationName = input.locationName?.trim() || challenge.venue;
  const locationSlug =
    slugifyLocation(input.locationSlug || locationName) ||
    slugifyLocation(challenge.venue);
  const bayName = input.bayName?.trim() || challenge.bayLabel;
  const e6EventCode = await getClubhouseEventCode(normalizedChallengeSlug);
  const bookingVerification = input.bookingVerificationId
    ? await getBookingVerificationRecord(input.bookingVerificationId)
    : null;

  if (!e6EventCode) {
    throw new Error("Simulator event code is not available.");
  }

  if (input.bookingVerificationId && !bookingVerification) {
    throw new Error("Booking verification record was not found.");
  }

  if (
    bookingVerification &&
    (bookingVerification.status === "Used" ||
      bookingVerification.status === "Rejected")
  ) {
    throw new Error("This booking is no longer available for entry.");
  }

  const prisma = getPrismaClient();
  const existing = prisma
    ? await prisma.clubhouseEntryRecord.findMany({
        select: { id: true, payarcCheckoutId: true, squareCheckoutId: true, stripeCheckoutSessionId: true },
      })
    : Object.values(
        await readJsonObject<Record<string, ClubhouseEntryRecord>>(entriesPath),
      );

  if (input.stripeCheckoutSessionId) {
    const existingStripeEntry = Object.values(existing).find(
      (entry) =>
        entry.stripeCheckoutSessionId === input.stripeCheckoutSessionId,
    );

    if (existingStripeEntry) {
      return (await getClubhouseEntryRecord(existingStripeEntry.id)) ?? existingStripeEntry;
    }
  }

  if (input.payarcCheckoutId) {
    const existingPayarcEntry = Object.values(existing).find(
      (entry) => entry.payarcCheckoutId === input.payarcCheckoutId,
    );

    if (existingPayarcEntry) {
      return (await getClubhouseEntryRecord(existingPayarcEntry.id)) ?? existingPayarcEntry;
    }
  }

  if (input.squareCheckoutId) {
    const existingSquareEntry = Object.values(existing).find(
      (entry) => entry.squareCheckoutId === input.squareCheckoutId,
    );

    if (existingSquareEntry) {
      return (await getClubhouseEntryRecord(existingSquareEntry.id)) ?? existingSquareEntry;
    }
  }

  const now = new Date();
  const validUntil = new Date(
    now.getTime() + challenge.playWindowMinutes * 60 * 1000,
  );
  const entryId = nextEntryId(Object.values(existing), now);
  const timestamp = now.toISOString();
  const entry: ClubhouseEntryRecord = {
    id: entryId,
    challengeSlug: normalizedChallengeSlug,
    playerName,
    playerEmail: input.playerEmail?.trim().toLowerCase() || undefined,
    phoneNumber,
    e6DisplayName,
    paymentStatus: "Succeeded",
    paidAt: formatDisplayDate(now),
    validFrom: formatDisplayDate(now),
    validUntil: formatDisplayDate(validUntil),
    attemptLimit: 1,
    resultStatus: "Pending E6 Result",
    e6EventCode,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    payarcCheckoutId: input.payarcCheckoutId,
    payarcOrderId: input.payarcOrderId,
    squareCheckoutId: input.squareCheckoutId,
    squareOrderId: input.squareOrderId,
    squarePaymentId: input.squarePaymentId,
    venueBookingReference: input.venueBookingReference?.trim() || undefined,
    bookingVerificationId: bookingVerification?.id,
    bookingVerificationStatus: bookingVerification ? "Auto Verified" : "Needs Review",
    paymentMethod: input.squareCheckoutId
      ? "Square"
      : input.payarcCheckoutId
      ? "Payarc"
      : input.stripeCheckoutSessionId
      ? "Stripe"
      : "Venue booking",
    locationSlug,
    locationName,
    bayName,
    amountCents: challenge.entryFeeCents,
    refundedAmountCents: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (prisma) {
    const created = await prisma.clubhouseEntryRecord.create({
      data: {
        ...entry,
        createdAt: now,
        updatedAt: now,
      },
    });

    if (bookingVerification) {
      await updateBookingVerificationStatus({
        bookingId: bookingVerification.id,
        status: "Used",
        matchedEntryId: entryId,
      });
    }

    return toClubhouseEntryRecord(created);
  }

  const jsonEntries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );

  jsonEntries[entryId] = entry;
  await writeJson(entriesPath, jsonEntries);

  if (bookingVerification) {
    await updateBookingVerificationStatus({
      bookingId: bookingVerification.id,
      status: "Used",
      matchedEntryId: entryId,
    });
  }

  return entry;
}
