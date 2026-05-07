import { listSimulatorResults, listSimulatorSessions } from "@/lib/simulator/store";
import type {
  SimulatorResult,
  SimulatorSession,
} from "@/lib/simulator/types";

type ExportRow = {
  pin2WinSessionId: string;
  sessionStatus: string;
  provider: string;
  challengeType: string;
  venueName: string;
  bayName: string;
  playerAlias: string;
  operatorName: string;
  course: string;
  hole: string;
  teeBox: string;
  pinLocation: string;
  attempts: string;
  playTimeMinutes: string;
  e6SessionName: string;
  e6SessionId: string;
  externalSessionId: string;
  syncEligible: string;
  sessionCreatedAt: string;
  sessionUpdatedAt: string;
  resultId: string;
  resultStatus: string;
  resultSource: string;
  rawResult: string;
  resultUnit: string;
  normalizedValue: string;
  evidenceUrl: string;
  verifierName: string;
  notes: string;
  resultCreatedAt: string;
};

function empty(value: string | number | boolean | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function rowFromSession(
  session: SimulatorSession,
  result?: SimulatorResult,
): ExportRow {
  return {
    pin2WinSessionId: session.pin2WinSessionId,
    sessionStatus: session.status,
    provider: session.provider,
    challengeType: session.challengeType,
    venueName: empty(session.venueName),
    bayName: empty(session.bayName),
    playerAlias: empty(result?.playerAlias ?? session.playerAlias),
    operatorName: empty(session.operatorName),
    course: empty(session.course),
    hole: empty(session.hole),
    teeBox: empty(session.teeBox),
    pinLocation: empty(session.pinLocation),
    attempts: empty(session.attempts),
    playTimeMinutes: empty(session.playTimeMinutes),
    e6SessionName: empty(session.e6SessionName),
    e6SessionId: empty(session.e6SessionId),
    externalSessionId: empty(session.externalSessionId),
    syncEligible: empty(session.syncEligible),
    sessionCreatedAt: session.createdAt,
    sessionUpdatedAt: session.updatedAt,
    resultId: empty(result?.id),
    resultStatus: empty(result?.status),
    resultSource: empty(result?.source),
    rawResult: empty(result?.rawResult),
    resultUnit: empty(result?.resultUnit),
    normalizedValue: empty(result?.normalizedValue),
    evidenceUrl: empty(result?.evidenceUrl),
    verifierName: empty(result?.verifierName),
    notes: empty(result?.notes),
    resultCreatedAt: empty(result?.createdAt),
  };
}

function exportRows(sessions: SimulatorSession[], results: SimulatorResult[]) {
  const sessionsById = new Map(
    sessions.map((session) => [session.pin2WinSessionId, session]),
  );
  const resultRows = results.map((result) => {
    const session = sessionsById.get(result.sessionId);

    return session
      ? rowFromSession(session, result)
      : {
          ...rowFromSession({
            id: result.sessionId,
            pin2WinSessionId: result.sessionId,
            provider: "OTHER",
            status: "VERIFIED",
            challengeType: result.challengeType,
            createdAt: result.createdAt,
            updatedAt: result.createdAt,
          }),
          resultId: result.id,
          resultStatus: result.status,
          resultSource: empty(result.source),
          rawResult: result.rawResult,
          resultUnit: empty(result.resultUnit),
          normalizedValue: empty(result.normalizedValue),
          evidenceUrl: empty(result.evidenceUrl),
          verifierName: empty(result.verifierName),
          notes: empty(result.notes),
          resultCreatedAt: result.createdAt,
        };
  });
  const sessionsWithResults = new Set(results.map((result) => result.sessionId));
  const sessionOnlyRows = sessions
    .filter((session) => !sessionsWithResults.has(session.pin2WinSessionId))
    .map((session) => rowFromSession(session));

  return [...resultRows, ...sessionOnlyRows];
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function toCsv(rows: ExportRow[]) {
  const headers = Object.keys(rows[0] ?? rowFromSession({
    id: "",
    pin2WinSessionId: "",
    provider: "OTHER",
    status: "CREATED",
    challengeType: "CLOSEST_TO_PIN",
    createdAt: "",
    updatedAt: "",
  })) as (keyof ExportRow)[];

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

function filename(format: string, pin2WinSessionId?: string | null) {
  const date = new Date().toISOString().slice(0, 10);
  const scope = pin2WinSessionId ? `-${pin2WinSessionId}` : "";

  return `pin2win-simulator-export${scope}-${date}.${format}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "csv";
  const pin2WinSessionId = url.searchParams.get("sessionId");
  const allSessions = await listSimulatorSessions();
  const sessions = pin2WinSessionId
    ? allSessions.filter(
        (session) => session.pin2WinSessionId === pin2WinSessionId,
      )
    : allSessions;
  const results = await listSimulatorResults(pin2WinSessionId ?? undefined);
  const rows = exportRows(sessions, results);

  if (format === "json") {
    return Response.json(
      {
        exportedAt: new Date().toISOString(),
        pin2WinSessionId,
        sessions,
        results,
        rows,
      },
      {
        headers: {
          "Content-Disposition": `attachment; filename="${filename(
            "json",
            pin2WinSessionId,
          )}"`,
        },
      },
    );
  }

  return new Response(toCsv(rows), {
    headers: {
      "Content-Disposition": `attachment; filename="${filename(
        "csv",
        pin2WinSessionId,
      )}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
