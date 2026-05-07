"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  FileText,
  Gauge,
  Laptop,
  Link2,
  MonitorUp,
  Network,
  Plus,
  Save,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SimulatorChallengeType,
  SimulatorProvider,
  SimulatorResult,
  SimulatorSession,
} from "@/lib/simulator/types";

const checklist = [
  "Confirm simulator system, device model, and software version",
  "Create a test entry with venue, bay, challenge, and player alias",
  "Run the simulator session outside the public Pin2Win flow",
  "Capture result, screenshot/evidence, and staff verifier",
  "Mark whether this result should sync later when integration is ready",
];

const challengeOptions: {
  label: string;
  value: SimulatorChallengeType;
}[] = [
  { label: "Closest to the Pin", value: "CLOSEST_TO_PIN" },
  { label: "Longest Drive", value: "LONGEST_DRIVE" },
];

const providerOptions: {
  label: string;
  value: SimulatorProvider;
}[] = [
  { label: "TruGolf Apogee + E6", value: "TRUGOLF_APOGEE_E6" },
  { label: "E6 Connect", value: "E6_CONNECT" },
  { label: "FlightScope + E6", value: "FLIGHTSCOPE_E6" },
  { label: "Manual simulator entry", value: "MANUAL" },
  { label: "Other", value: "OTHER" },
];

const resultFieldDefs = [
  { key: "pin2WinSessionId", label: "Pin2Win session ID" },
  { key: "playerAlias", label: "Player alias" },
  { key: "e6SessionId", label: "Simulator session ID" },
  { key: "evidenceUrl", label: "Evidence URL" },
] as const;

type SetupForm = {
  venueName: string;
  bayName: string;
  provider: SimulatorProvider;
  challengeType: SimulatorChallengeType;
  playerAlias: string;
  operatorName: string;
  course: string;
  hole: string;
  attempts: string;
  playTimeMinutes: string;
};

type ResultForm = {
  pin2WinSessionId: string;
  playerAlias: string;
  challengeType: SimulatorChallengeType;
  rawResult: string;
  resultUnit: string;
  e6SessionId: string;
  evidenceUrl: string;
  verifierName: string;
  notes: string;
};

type SimulatorPayload = {
  sessions: SimulatorSession[];
  results: SimulatorResult[];
};

const defaultSetupForm: SetupForm = {
  venueName: "Partner simulator lab",
  bayName: "Bay 01",
  provider: "TRUGOLF_APOGEE_E6",
  challengeType: "CLOSEST_TO_PIN",
  playerAlias: "",
  operatorName: "",
  course: "",
  hole: "1",
  attempts: "10",
  playTimeMinutes: "15",
};

function challengeLabel(challengeType: SimulatorChallengeType) {
  return (
    challengeOptions.find((option) => option.value === challengeType)?.label ??
    challengeType
  );
}

function providerLabel(provider: SimulatorProvider) {
  return (
    providerOptions.find((option) => option.value === provider)?.label ??
    provider
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
  const [setupForm, setSetupForm] = useState<SetupForm>(defaultSetupForm);
  const [resultForm, setResultForm] = useState<ResultForm>({
    pin2WinSessionId: "",
    playerAlias: "",
    challengeType: "CLOSEST_TO_PIN",
    rawResult: "",
    resultUnit: "ft/in",
    e6SessionId: "",
    evidenceUrl: "",
    verifierName: "",
    notes: "",
  });
  const [saveMessage, setSaveMessage] = useState("");
  const [portalMessage, setPortalMessage] = useState("Loading simulator sessions...");
  const [isSaving, setIsSaving] = useState(false);
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
      setPortalMessage("No test sessions yet. Create one to start capturing verified results.");
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

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    setResultForm((current) => ({
      ...current,
      pin2WinSessionId: selectedSession.pin2WinSessionId,
      playerAlias: selectedSession.playerAlias ?? current.playerAlias,
      challengeType: selectedSession.challengeType,
      resultUnit: selectedSession.challengeType === "LONGEST_DRIVE" ? "yd" : "ft/in",
      e6SessionId: selectedSession.e6SessionId ?? current.e6SessionId,
    }));
  }, [selectedSession]);

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
  const resultUnit =
    resultForm.challengeType === "LONGEST_DRIVE" ? "yd" : "ft / in";
  const resultPlaceholder =
    resultForm.challengeType === "LONGEST_DRIVE" ? "287" : "4 ft 8 in";
  const pendingSyncCount = testResults.filter(
    (result) => result.status !== "SYNCED",
  ).length;

  const handleSetupChange = (key: keyof SetupForm, value: string) => {
    setSetupForm((current) => ({ ...current, [key]: value }));
    setPortalMessage("");
  };

  const handleSelectedSession = (pin2WinSessionId: string) => {
    setSelectedSessionId(pin2WinSessionId);
    setSaveMessage("");
  };

  const handleResultChange = (key: keyof ResultForm, value: string) => {
    setResultForm((current) => ({ ...current, [key]: value }));
    setSaveMessage("");
  };

  const createTestSession = async () => {
    setIsCreating(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/simulator/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueName: setupForm.venueName,
          bayName: setupForm.bayName,
          provider: setupForm.provider,
          challengeType: setupForm.challengeType,
          playerAlias: setupForm.playerAlias,
          operatorName: setupForm.operatorName,
          course: setupForm.course,
          hole: Number.parseInt(setupForm.hole, 10) || undefined,
          attempts: Number.parseInt(setupForm.attempts, 10) || undefined,
          playTimeMinutes:
            Number.parseInt(setupForm.playTimeMinutes, 10) || undefined,
          syncEligible: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not create test session.");
      }

      const payload = (await response.json()) as { session: SimulatorSession };

      setSessions((current) => [payload.session, ...current]);
      setSelectedSessionId(payload.session.pin2WinSessionId);
      setPortalMessage(`${payload.session.pin2WinSessionId} is ready for off-site testing.`);
    } catch (error) {
      setPortalMessage(
        error instanceof Error ? error.message : "Could not create test session.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const saveVerifiedResult = async () => {
    if (!resultForm.pin2WinSessionId) {
      setSaveMessage("Create or select a Pin2Win test session first.");
      return;
    }

    setIsSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch(
        `/api/simulator/sessions/${resultForm.pin2WinSessionId}/results`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "MANUAL_ENTRY",
            playerAlias: resultForm.playerAlias || "Unnamed tester",
            rawResult: resultForm.rawResult,
            resultUnit:
              resultForm.challengeType === "LONGEST_DRIVE" ? "yd" : "ft/in",
            evidenceUrl: resultForm.evidenceUrl,
            verifierName: resultForm.verifierName,
            notes: resultForm.notes,
            rawPayload: {
              e6SessionId: resultForm.e6SessionId,
              capturedFrom: "testing-portal",
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Could not save verified result.");
      }

      const payload = (await response.json()) as { result: SimulatorResult };

      setTestResults((current) => [payload.result, ...current]);
      setSessions((current) =>
        current.map((session) =>
          session.pin2WinSessionId === resultForm.pin2WinSessionId
            ? { ...session, status: "VERIFIED", updatedAt: new Date().toISOString() }
            : session,
        ),
      );
      setResultForm((current) => ({
        ...current,
        rawResult: "",
        evidenceUrl: "",
        notes: "",
      }));
      setSaveMessage(`${resultForm.pin2WinSessionId} saved to the test leaderboard.`);
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Could not save verified result.",
      );
    } finally {
      setIsSaving(false);
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
                <Link
                  key={session.pin2WinSessionId}
                  className={cn(
                    "rounded-md border p-4 text-left transition",
                    selectedSession?.pin2WinSessionId === session.pin2WinSessionId
                      ? "border-[#2f6b3f] bg-[#e3edd8]"
                      : "border-[#d7dfd4] bg-[#fbfdf9] hover:border-[#2f6b3f]",
                  )}
                  href={`/testing-portal/sessions/${session.pin2WinSessionId}`}
                  onMouseEnter={() =>
                    handleSelectedSession(session.pin2WinSessionId)
                  }
                  onFocus={() => handleSelectedSession(session.pin2WinSessionId)}
                >
                  <span className="text-sm font-black text-[#2f6b3f]">
                    {session.pin2WinSessionId}
                  </span>
                  <span className="mt-2 block font-black">
                    {session.venueName || "Testing venue"}
                  </span>
                  <span className="mt-1 block text-sm text-[#59655f]">
                    {challengeLabel(session.challengeType)}
                  </span>
                  <span className="mt-2 inline-flex rounded bg-white/70 px-2 py-1 text-xs font-black text-[#53605a]">
                    {session.status}
                  </span>
                </Link>
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

          <div className="grid gap-6 xl:grid-cols-[1fr_0.82fr]">
            <section className="rounded-lg border border-[#d7dfd4] bg-white p-6">
              <div className="flex items-center gap-3">
                <Laptop className="text-[#2f6b3f]" size={28} />
                <h2 className="text-2xl font-black">Off-site test setup</h2>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Partner / venue
                  <input
                    className="h-12 rounded-md border border-[#d7dfd4] bg-[#fbfdf9] px-4 text-base font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
                    value={setupForm.venueName}
                    onChange={(event) =>
                      handleSetupChange("venueName", event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Bay
                  <input
                    className="h-12 rounded-md border border-[#d7dfd4] bg-[#fbfdf9] px-4 text-base font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
                    value={setupForm.bayName}
                    onChange={(event) =>
                      handleSetupChange("bayName", event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Simulator system
                  <select
                    className="h-12 rounded-md border border-[#d7dfd4] bg-[#fbfdf9] px-4 text-base font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
                    value={setupForm.provider}
                    onChange={(event) =>
                      handleSetupChange("provider", event.target.value)
                    }
                  >
                    {providerOptions.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Challenge
                  <select
                    className="h-12 rounded-md border border-[#d7dfd4] bg-[#fbfdf9] px-4 text-base font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
                    value={setupForm.challengeType}
                    onChange={(event) =>
                      handleSetupChange("challengeType", event.target.value)
                    }
                  >
                    {challengeOptions.map((challenge) => (
                      <option key={challenge.value} value={challenge.value}>
                        {challenge.label}
                      </option>
                    ))}
                  </select>
                </label>
                {[
                  ["playerAlias", "Player alias"],
                  ["operatorName", "Operator / verifier"],
                  ["course", "Course / range setup"],
                  ["hole", "Hole"],
                  ["attempts", "Attempts"],
                  ["playTimeMinutes", "Play time minutes"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="grid gap-2 text-sm font-bold text-[#53605a]"
                  >
                    {label}
                    <input
                      className="h-12 rounded-md border border-[#d7dfd4] bg-[#fbfdf9] px-4 text-base font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
                      value={setupForm[key as keyof SetupForm]}
                      onChange={(event) =>
                        handleSetupChange(
                          key as keyof SetupForm,
                          event.target.value,
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-lg bg-[#18211f] p-6 text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#a8c878]" size={28} />
                <h2 className="text-2xl font-black">Isolation rules</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  "Do not publish test results to the public leaderboard.",
                  "Do not charge real customer payment methods.",
                  "Use player aliases unless explicit permission is granted.",
                  "Keep raw simulator evidence for later integration mapping.",
                ].map((rule) => (
                  <div key={rule} className="rounded-md bg-white/8 p-4">
                    <p className="text-sm leading-6 text-white/78">{rule}</p>
                  </div>
                ))}
              </div>
              {selectedSession ? (
                <div className="mt-5 rounded-md bg-white/8 p-4">
                  <p className="text-sm font-black text-[#a8c878]">
                    Selected session
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {selectedSession.pin2WinSessionId}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    {providerLabel(selectedSession.provider)} |{" "}
                    {challengeLabel(selectedSession.challengeType)}
                  </p>
                </div>
              ) : null}
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-lg border border-[#d7dfd4] bg-white p-6">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="text-[#2f6b3f]" size={28} />
                <h2 className="text-2xl font-black">Run checklist</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {checklist.map((item, index) => (
                  <label
                    key={item}
                    className="flex gap-3 rounded-md bg-[#fbfdf9] p-4 text-sm leading-6"
                  >
                    <input
                      className="mt-1 size-4 accent-[#2f6b3f]"
                      type="checkbox"
                    />
                    <span>
                      <strong>Step {index + 1}:</strong> {item}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d7dfd4] bg-white p-6">
              <div className="flex items-center gap-3">
                <FileText className="text-[#2f6b3f]" size={28} />
                <h2 className="text-2xl font-black">Result capture</h2>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {resultFieldDefs.map((field) => (
                  <label
                    key={field.key}
                    className="grid gap-2 text-sm font-bold text-[#53605a]"
                  >
                    {field.label}
                    <input
                      className="h-12 rounded-md border border-[#d7dfd4] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                      value={resultForm[field.key]}
                      onChange={(event) =>
                        handleResultChange(field.key, event.target.value)
                      }
                    />
                  </label>
                ))}
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Challenge
                  <select
                    className="h-12 rounded-md border border-[#d7dfd4] bg-white px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                    value={resultForm.challengeType}
                    onChange={(event) =>
                      handleResultChange("challengeType", event.target.value)
                    }
                  >
                    {challengeOptions.map((challenge) => (
                      <option key={challenge.value} value={challenge.value}>
                        {challenge.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Result
                  <div className="flex h-12 overflow-hidden rounded-md border border-[#d7dfd4] bg-white focus-within:border-[#2f6b3f]">
                    <input
                      className="min-w-0 flex-1 px-4 text-base text-[#18211f] outline-none"
                      placeholder={resultPlaceholder}
                      value={resultForm.rawResult}
                      onChange={(event) =>
                        handleResultChange("rawResult", event.target.value)
                      }
                    />
                    <span className="flex min-w-20 items-center justify-center border-l border-[#d7dfd4] bg-[#f2eadb] px-4 text-sm font-black text-[#53605a]">
                      {resultUnit}
                    </span>
                  </div>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Verifier
                  <input
                    className="h-12 rounded-md border border-[#d7dfd4] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                    value={resultForm.verifierName}
                    onChange={(event) =>
                      handleResultChange("verifierName", event.target.value)
                    }
                  />
                </label>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Verification notes
                  <textarea
                    className="min-h-28 rounded-md border border-[#d7dfd4] px-4 py-3 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                    value={resultForm.notes}
                    onChange={(event) =>
                      handleResultChange("notes", event.target.value)
                    }
                  />
                </label>
                <div className="rounded-md bg-[#e3edd8] p-4">
                  <Database className="text-[#2f6b3f]" size={24} />
                  <h3 className="mt-3 font-black">Local session payload</h3>
                  <p className="mt-2 text-sm leading-6 text-[#405047]">
                    The portal now stores verified test results through the
                    same API used by the Windows agent. This keeps manual
                    testing, simulator evidence, and future sync fields aligned.
                  </p>
                </div>
              </div>
              <button
                className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-6 text-sm font-black text-white transition hover:bg-[#3f7f4c] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={saveVerifiedResult}
                disabled={isSaving}
              >
                <Save size={18} />{" "}
                {isSaving ? "Saving..." : "Save verified test result"}
              </button>
              {saveMessage ? (
                <p className="mt-3 rounded-md bg-[#e3edd8] px-4 py-3 text-sm font-black text-[#2f6b3f]">
                  {saveMessage}
                </p>
              ) : null}
            </section>
          </div>

          <section className="rounded-lg border border-[#d7dfd4] bg-white p-6">
            <div className="flex items-center gap-3">
              <Trophy className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">Test leaderboards</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#59655f]">
              These saved results are for off-site validation only. They do not
              publish to the public Pin2Win leaderboard.
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
                            {result.playerAlias || "Unnamed tester"}
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
