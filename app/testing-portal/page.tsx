"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Gauge,
  Link2,
  MonitorUp,
  Network,
  Plus,
  Trash2,
  Trophy,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SimulatorChallengeType,
  SimulatorResult,
  SimulatorSession,
} from "@/lib/simulator/types";

const challengeOptions: {
  label: string;
  value: SimulatorChallengeType;
}[] = [
  { label: "Closest to the Pin", value: "CLOSEST_TO_PIN" },
  { label: "Longest Drive", value: "LONGEST_DRIVE" },
];

type SimulatorPayload = {
  sessions: SimulatorSession[];
  results: SimulatorResult[];
};

function challengeLabel(challengeType: SimulatorChallengeType) {
  return (
    challengeOptions.find((option) => option.value === challengeType)?.label ??
    challengeType
  );
}

function formattedTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function displayResult(result: SimulatorResult) {
  if (!result.rawResult) {
    return "No result";
  }

  if (result.rawResult.match(/\b(ft|in|yd|yard|yards)\b/i)) {
    return result.rawResult;
  }

  return `${result.rawResult} ${result.resultUnit ?? ""}`.trim();
}

export default function TestingPortalPage() {
  const [sessions, setSessions] = useState<SimulatorSession[]>([]);
  const [testResults, setTestResults] = useState<SimulatorResult[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [portalMessage, setPortalMessage] = useState("Loading simulator sessions...");
  const [isCreating, setIsCreating] = useState(false);

  const selectedSession =
    sessions.find((session) => session.pin2WinSessionId === selectedSessionId) ??
    sessions[0] ??
    null;

  const loadSimulatorData = async () => {
    const response = await fetch("/api/simulator/sessions", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load simulator sessions.");
    }

    const payload = (await response.json()) as SimulatorPayload;

    setSessions(payload.sessions);
    setTestResults(payload.results);

    if (payload.sessions.length === 0) {
      setPortalMessage("No test sessions yet. Create one, then open it to enter setup and results.");
      return;
    }

    setPortalMessage("Simulator sessions are synced with the local backend.");
    setSelectedSessionId((current) => current || payload.sessions[0].pin2WinSessionId);
  };

  useEffect(() => {
    loadSimulatorData().catch((error: unknown) => {
      setPortalMessage(
        error instanceof Error
          ? error.message
          : "Unable to load simulator sessions.",
      );
    });
  }, []);

  const closestToPinResults = useMemo(
    () =>
      testResults
        .filter((result) => result.challengeType === "CLOSEST_TO_PIN")
        .sort(
          (a, b) =>
            (a.normalizedValue ?? Number.POSITIVE_INFINITY) -
            (b.normalizedValue ?? Number.POSITIVE_INFINITY),
        ),
    [testResults],
  );
  const longestDriveResults = useMemo(
    () =>
      testResults
        .filter((result) => result.challengeType === "LONGEST_DRIVE")
        .sort((a, b) => (b.normalizedValue ?? 0) - (a.normalizedValue ?? 0)),
    [testResults],
  );
  const pendingSyncCount = testResults.filter(
    (result) => result.status !== "SYNCED",
  ).length;

  const handleSelectedSession = (pin2WinSessionId: string) => {
    setSelectedSessionId(pin2WinSessionId);
  };

  const createTestSession = async () => {
    setIsCreating(true);

    try {
      const response = await fetch("/api/simulator/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "TRUGOLF_APOGEE_E6",
          challengeType: "CLOSEST_TO_PIN",
          venueName: "",
          bayName: "",
          syncEligible: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not create test session.");
      }

      const payload = (await response.json()) as { session: SimulatorSession };

      setSessions((current) => [payload.session, ...current]);
      setSelectedSessionId(payload.session.pin2WinSessionId);
      setPortalMessage(
        `Created ${payload.session.pin2WinSessionId}. Open it to enter setup information and results.`,
      );
    } catch (error) {
      setPortalMessage(
        error instanceof Error ? error.message : "Could not create test session.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTestSession = async (pin2WinSessionId: string) => {
    const confirmed = window.confirm(
      `Delete ${pin2WinSessionId} and any saved test results for this session?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/simulator/sessions/${pin2WinSessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete test session.");
      }

      setSessions((current) =>
        current.filter((session) => session.pin2WinSessionId !== pin2WinSessionId),
      );
      setTestResults((current) =>
        current.filter((result) => result.sessionId !== pin2WinSessionId),
      );
      setSelectedSessionId((current) =>
        current === pin2WinSessionId ? "" : current,
      );
      setPortalMessage(`${pin2WinSessionId} deleted.`);
    } catch (error) {
      setPortalMessage(
        error instanceof Error ? error.message : "Could not delete test session.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#18211f]">
      <header className="border-b border-[#d7dfd4] bg-white px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Pin2Win off-site testing
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Simulator testing portal
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-md bg-[#e3edd8] px-4 py-2 text-sm font-black text-[#2f6b3f]">
              Isolated from website
            </span>
            <span className="rounded-md bg-[#18211f] px-4 py-2 text-sm font-black text-white">
              Local backend ready
            </span>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7dfd4] bg-white px-4 text-sm font-black text-[#18211f] transition hover:border-[#2f6b3f]"
              href="/testing-portal/site-notes"
            >
              <ClipboardCheck size={16} /> Site notes
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7dfd4] bg-white px-4 text-sm font-black text-[#18211f] transition hover:border-[#2f6b3f]"
              href="/testing-portal/import"
            >
              <Upload size={16} /> Import
            </Link>
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7dfd4] bg-white px-4 text-sm font-black text-[#18211f] transition hover:border-[#2f6b3f]"
              href="/api/simulator/export?format=csv"
            >
              <Download size={16} /> CSV
            </a>
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7dfd4] bg-white px-4 text-sm font-black text-[#18211f] transition hover:border-[#2f6b3f]"
              href="/api/simulator/export?format=json"
            >
              <Download size={16} /> JSON
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-[#d7dfd4] bg-white p-5">
          <div className="flex items-center gap-3">
            <MonitorUp className="text-[#2f6b3f]" size={26} />
            <h2 className="text-xl font-black">Test sessions</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session.pin2WinSessionId}
                  className={cn(
                    "rounded-md border p-4 text-left transition",
                    selectedSession?.pin2WinSessionId === session.pin2WinSessionId
                      ? "border-[#2f6b3f] bg-[#e3edd8]"
                      : "border-[#d7dfd4] bg-[#fbfdf9] hover:border-[#2f6b3f]",
                  )}
                  onMouseEnter={() =>
                    handleSelectedSession(session.pin2WinSessionId)
                  }
                  onFocus={() => handleSelectedSession(session.pin2WinSessionId)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      className="text-sm font-black text-[#2f6b3f] underline-offset-4 hover:underline"
                      href={`/testing-portal/sessions/${session.pin2WinSessionId}`}
                    >
                      {session.pin2WinSessionId}
                    </Link>
                    <button
                      aria-label={`Delete ${session.pin2WinSessionId}`}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-[#d7dfd4] bg-white text-[#9f2d24] transition hover:border-[#9f2d24] hover:bg-[#fff1ef]"
                      type="button"
                      onClick={() => deleteTestSession(session.pin2WinSessionId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <span className="mt-2 block font-black">
                    {session.venueName || "Testing venue"}
                  </span>
                  <span className="mt-1 block text-sm text-[#59655f]">
                    {challengeLabel(session.challengeType)}
                  </span>
                  <span className="mt-2 inline-flex rounded bg-white/70 px-2 py-1 text-xs font-black text-[#53605a]">
                    {session.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[#b9c6b5] bg-[#fbfdf9] p-4 text-sm font-bold text-[#59655f]">
                No sessions created yet.
              </div>
            )}
          </div>
          <button
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={createTestSession}
            disabled={isCreating}
          >
            <Plus size={17} /> {isCreating ? "Creating..." : "New test"}
          </button>
        </aside>

        <section className="grid gap-6">
          {portalMessage ? (
            <p className="rounded-lg border border-[#d7dfd4] bg-white px-5 py-4 text-sm font-black text-[#2f6b3f]">
              {portalMessage}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Active tests", String(sessions.length), Activity],
              ["Verified results", String(testResults.length), CheckCircle2],
              ["Pending sync", String(pendingSyncCount), Link2],
              ["Integrations", "Manual", Network],
            ].map(([label, value, Icon]) => (
              <div
                key={label as string}
                className="rounded-lg border border-[#d7dfd4] bg-white p-5"
              >
                <Icon className="text-[#2f6b3f]" size={26} />
                <p className="mt-4 text-sm font-black text-[#59655f]">
                  {label as string}
                </p>
                <p className="mt-1 text-3xl font-black">{value as string}</p>
              </div>
            ))}
          </div>

          <section className="rounded-lg border border-[#d7dfd4] bg-white p-6">
            <div className="flex items-center gap-3">
              <Trophy className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">Test leaderboards</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#59655f]">
              These saved results are for off-site validation only. Open a test
              session to edit setup information or capture results.
            </p>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              {[
                {
                  title: "Closest to the Pin",
                  hint: "Lower distance ranks higher",
                  rows: closestToPinResults,
                },
                {
                  title: "Longest Drive",
                  hint: "Higher distance ranks higher",
                  rows: longestDriveResults,
                },
              ].map((board) => (
                <div
                  key={board.title}
                  className="overflow-hidden rounded-md border border-[#d7dfd4]"
                >
                  <div className="bg-[#18211f] px-4 py-4 text-white">
                    <h3 className="text-xl font-black">{board.title}</h3>
                    <p className="mt-1 text-sm font-bold text-white/58">
                      {board.hint}
                    </p>
                  </div>
                  <div className="grid grid-cols-[62px_1fr_110px] gap-3 bg-[#f2eadb] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
                    <span>Rank</span>
                    <span>Player</span>
                    <span>Result</span>
                  </div>
                  {board.rows.length > 0 ? (
                    board.rows.map((result, index) => (
                      <div
                        key={result.id}
                        className="grid grid-cols-[62px_1fr_110px] gap-3 border-t border-[#d7dfd4] px-4 py-4 text-sm"
                      >
                        <span className="font-black">#{index + 1}</span>
                        <div>
                          <p className="font-black">
                            {result.playerAlias || "Player alias not set"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#6b756f]">
                            {result.sessionId} | {formattedTime(result.createdAt)}
                          </p>
                        </div>
                        <span className="font-black text-[#2f6b3f]">
                          {displayResult(result)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="border-t border-[#d7dfd4] px-4 py-5 text-sm font-bold text-[#6b756f]">
                      No verified test results yet.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#d7dfd4] bg-white p-6">
            <div className="flex items-center gap-3">
              <Gauge className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">Integration readiness</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["Manual MVP", "Ready", "Verified staff entry works now."],
                ["Local agent", "Ready", "Windows agent can create sessions and post results."],
                ["Direct API", "Blocked", "Requires vendor-supported API path."],
              ].map(([title, status, detail]) => (
                <div key={title} className="rounded-md bg-[#fbfdf9] p-5">
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-[#2f6b3f]">
                    {status}
                  </p>
                  <h3 className="mt-2 text-xl font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#59655f]">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
