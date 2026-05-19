import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ClubhouseEntry } from "@/lib/clubhouse";
import { getClubhouseChallenge } from "@/lib/clubhouse";

export type ClubhouseEntryRecord = ClubhouseEntry & {
  e6EventCode: string;
  createdAt: string;
  updatedAt: string;
};

const entriesPath = path.join(process.cwd(), ".pin2win-clubhouse-entries.json");
const eventCodesPath = path.join(
  process.cwd(),
  ".pin2win-clubhouse-event-codes.json",
);

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

export async function getClubhouseEntryRecord(entryId: string) {
  const entries = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );

  return entries[entryId] ?? null;
}

async function getSavedEventCode(challengeSlug: string) {
  const challenge = getClubhouseChallenge(challengeSlug);

  if (!challenge) {
    return null;
  }

  const eventCodes =
    await readJsonObject<Record<string, string>>(eventCodesPath);

  return eventCodes[challengeSlug] ?? challenge.e6JoinCode;
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
  e6DisplayName: string;
}) {
  const challenge = getClubhouseChallenge(input.challengeSlug);

  if (!challenge) {
    throw new Error("Challenge not found.");
  }

  const playerName = input.playerName.trim();
  const e6DisplayName = input.e6DisplayName.trim();

  if (!playerName || !e6DisplayName) {
    throw new Error("Player name and E6 account name are required.");
  }

  const e6EventCode = await getSavedEventCode(input.challengeSlug);

  if (!e6EventCode) {
    throw new Error("E6 Event Join Code is not available.");
  }

  const existing = await readJsonObject<Record<string, ClubhouseEntryRecord>>(
    entriesPath,
  );
  const now = new Date();
  const validUntil = new Date(
    now.getTime() + challenge.playWindowMinutes * 60 * 1000,
  );
  const entryId = nextEntryId(Object.values(existing), now);
  const timestamp = now.toISOString();
  const entry: ClubhouseEntryRecord = {
    id: entryId,
    challengeSlug: input.challengeSlug,
    playerName,
    e6DisplayName,
    paymentStatus: "Succeeded",
    paidAt: formatDisplayDate(now),
    validFrom: formatDisplayDate(now),
    validUntil: formatDisplayDate(validUntil),
    attemptLimit: 1,
    resultStatus: "Pending E6 Result",
    e6EventCode,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  existing[entryId] = entry;
  await writeJson(entriesPath, existing);

  return entry;
}
