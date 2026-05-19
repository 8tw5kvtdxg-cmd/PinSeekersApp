import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getClubhouseChallenge } from "@/lib/clubhouse";

type EventCodeStore = Record<string, string>;

export const dynamic = "force-dynamic";

const eventCodeStorePath = path.join(
  process.cwd(),
  ".pin2win-clubhouse-event-codes.json",
);

async function readEventCodeStore(): Promise<EventCodeStore> {
  try {
    const file = await readFile(eventCodeStorePath, "utf8");
    const parsed = JSON.parse(file) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}

async function writeEventCodeStore(store: EventCodeStore) {
  await writeFile(eventCodeStorePath, `${JSON.stringify(store, null, 2)}\n`);
}

async function getEventCode(challengeId: string) {
  const challenge = getClubhouseChallenge(challengeId);

  if (!challenge) {
    return null;
  }

  const store = await readEventCodeStore();

  return store[challengeId] ?? challenge.e6JoinCode;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ challengeId: string }> },
) {
  const { challengeId } = await context.params;
  const eventCode = await getEventCode(challengeId);

  if (!eventCode) {
    return Response.json({ error: "Challenge not found." }, { status: 404 });
  }

  return Response.json({ challengeId, eventCode });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ challengeId: string }> },
) {
  const { challengeId } = await context.params;
  const challenge = getClubhouseChallenge(challengeId);

  if (!challenge) {
    return Response.json({ error: "Challenge not found." }, { status: 404 });
  }

  const body = (await request.json()) as { eventCode?: unknown };
  const eventCode =
    typeof body.eventCode === "string" ? body.eventCode.trim() : "";

  if (!eventCode) {
    return Response.json(
      { error: "E6 Event Join Code is required." },
      { status: 400 },
    );
  }

  const store = await readEventCodeStore();
  store[challengeId] = eventCode;
  await writeEventCodeStore(store);

  return Response.json({ challengeId, eventCode });
}
