import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ClubhouseEntry } from "@/lib/clubhouse";
import {
  clubhouseChallenges,
  getClubhouseChallenge,
  normalizeChallengeSlug,
} from "@/lib/clubhouse";
import { getClubhouseEventCode } from "@/lib/clubhouse-challenge-settings";
import { slugifyLocation } from "@/lib/location-utils";

export type ClubhouseEntryRecord = ClubhouseEntry & {
  e6EventCode: string;
  stripeCheckoutSessionId?: string;
  locationSlug: string;
  locationName: string;
  bayName?: string;
  amountCents: number;
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
};

export type ClubhousePotSummary = {
  challengeSlug: string;
  challengeName: string;
  entryCount: number;
  revenueCents: number;
  potCents: number;
  potRate: number;
};

const potRate = 0.05;
const monthlyStartingPotCents = 5000;

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

export async function listClubhouseEntryRecords() {
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

export async function getClubhousePotSummaries() {
  const entries = await listClubhouseEntryRecords();

  return clubhouseChallenges.map((challenge) => {
    const paidEntries = entries.filter(
      (entry) =>
        normalizeChallengeSlug(entry.challengeSlug) === challenge.slug &&
        entry.paymentStatus === "Succeeded" &&
        Boolean(entry.stripeCheckoutSessionId),
    );
    const revenueCents = paidEntries.length * challenge.entryFeeCents;

    return {
      challengeSlug: challenge.slug,
      challengeName: challenge.name,
      entryCount: paidEntries.length,
      revenueCents,
      potCents: monthlyStartingPotCents + Math.round(revenueCents * potRate),
      potRate,
    };
  });
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

export async function getClubhousePotSummary(challengeSlug: string) {
  const normalizedSlug = normalizeChallengeSlug(challengeSlug);
  const summaries = await getClubhousePotSummaries();

  return summaries.find((summary) => summary.challengeSlug === normalizedSlug);
}

export async function getClubhouseEntryRecord(entryId: string) {
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
  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );
  const entry = entries[input.entryId];

  if (!entry) {
    throw new Error("Entry not found.");
  }

  const result = input.result.trim();

  if (!result) {
    throw new Error("Result display value is required.");
  }

  if (!Number.isFinite(input.resultValue) || input.resultValue < 0) {
    throw new Error("Result sort value must be a positive number.");
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

export async function deleteClubhouseEntryRecord(entryId: string) {
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
  const eligibleEntries = entries.filter(
    (entry) =>
      entry.paymentStatus === "Succeeded" &&
      entry.resultStatus === "Verified" &&
      typeof entry.resultValue === "number" &&
      entry.result &&
      entry.resultUnit,
  );
  const sortedEntries = eligibleEntries.sort((a, b) => {
    if (challenge?.type === "CLOSEST_TO_PIN") {
      return (a.resultValue ?? 0) - (b.resultValue ?? 0);
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
    resultUnit: entry.resultUnit ?? (challenge?.type === "CLOSEST_TO_PIN" ? "inches" : "yards"),
    paidAt: entry.paidAt,
    resultStatus: entry.resultStatus,
  }));
}

export async function getClubhouseEntryRecordByStripeSessionId(
  stripeCheckoutSessionId: string,
) {
  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );

  return (
    Object.values(entries).find(
      (entry) => entry.stripeCheckoutSessionId === stripeCheckoutSessionId,
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

function nextEntryId(entries: ClubhouseEntryRecord[], now: Date) {
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
  phoneNumber: string;
  e6DisplayName: string;
  stripeCheckoutSessionId?: string;
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
    throw new Error("Player name, phone number, and E6 account name are required.");
  }

  const normalizedChallengeSlug = normalizeChallengeSlug(input.challengeSlug);
  const locationName = input.locationName?.trim() || challenge.venue;
  const locationSlug =
    slugifyLocation(input.locationSlug || locationName) ||
    slugifyLocation(challenge.venue);
  const bayName = input.bayName?.trim() || challenge.bayLabel;
  const e6EventCode = await getClubhouseEventCode(normalizedChallengeSlug);

  if (!e6EventCode) {
    throw new Error("E6 Event Join Code is not available.");
  }

  const existing = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );

  if (input.stripeCheckoutSessionId) {
    const existingStripeEntry = Object.values(existing).find(
      (entry) =>
        entry.stripeCheckoutSessionId === input.stripeCheckoutSessionId,
    );

    if (existingStripeEntry) {
      return existingStripeEntry;
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
    locationSlug,
    locationName,
    bayName,
    amountCents: challenge.entryFeeCents,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  existing[entryId] = entry;
  await writeJson(entriesPath, existing);

  return entry;
}
