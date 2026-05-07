"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Flag,
  Gauge,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type {
  SimulatorResult,
  SimulatorSession,
  SimulatorSessionStatus,
} from "@/lib/simulator/types";

type SessionPayload = {
  session: SimulatorSession;
  results: SimulatorResult[];
};

type ResultForm = {
  rawResult: string;
  evidenceUrl: string;
  verifierName: string;
  notes: string;
};

const statusActions: {
  label: string;
  status: SimulatorSessionStatus;
  icon: typeof CheckCircle2;
}[] = [
  { label: "Operator ready", status: "OPERATOR_READY", icon: CheckCircle2 },
  { label: "Launched", status: "LAUNCHED", icon: Play },
  { label: "In progress", status: "IN_PROGRESS", icon: Gauge },
  { label: "Result pending", status: "RESULT_PENDING", icon: FileText },
  { label: "Verified", status: "VERIFIED", icon: ShieldCheck },
];

function challengeLabel(session?: SimulatorSession | null) {
  if (!session) {
    return "Simulator challenge";
  }

  return session.challengeType === "LONGEST_DRIVE"
    ? "Longest Drive"
    : "Closest to the Pin";
}

function providerLabel(value?: string) {
  const labels: Record<string, string> = {
    TRUGOLF_APOGEE_E6: "TruGolf Apogee + E6",
    E6_CONNECT: "E6 Connect",
    FLIGHTSCOPE_E6: "FlightScope + E6",
    MANUAL: "Manual simulator entry",
    OTHER: "Other simulator",
  };

  return value ? labels[value] ?? value : "Simulator";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function resultDisplay(result: SimulatorResult) {
  if (result.rawResult.match(/\b(ft|in|yd|yard|yards)\b/i)) {
    return result.rawResult;
  }

  return `${result.rawResult} ${result.resultUnit ?? ""}`.trim();
}

export default function OperatorSessionPage() {
  const params = useParams<{ pin2WinSessionId: string }>();
  const pin2WinSessionId = params.pin2WinSessionId;
  const [session, setSession] = useState<SimulatorSession | null>(null);
  const [results, setResults] = useState<SimulatorResult[]>([]);
  const [message, setMessage] = useState("Loading session...");
  const [isBusy, setIsBusy] = useState(false);
  const [resultForm, setResultForm] = useState<ResultForm>({
    rawResult: "",
    evidenceUrl: "",
    verifierName: "",
    notes: "",
  });

  const resultUnit = session?.challengeType === "LONGEST_DRIVE" ? "yd" : "ft/in";
  const resultPlaceholder =
    session?.challengeType === "LONGEST_DRIVE" ? "287" : "4 ft 8 in";
  const sortedResults = useMemo(
    () =>
      [...results].sort((a, b) => {
        if (session?.challengeType === "LONGEST_DRIVE") {
          return (b.normalizedValue ?? 0) - (a.normalizedValue ?? 0);
        }

        return (
          (a.normalizedValue ?? Number.POSITIVE_INFINITY) -
          (b.normalizedValue ?? Number.POSITIVE_INFINITY)
        );
      }),
    [results, session?.challengeType],
  );

  const loadSession = async () => {
    const response = await fetch(`/api/simulator/sessions/${pin2WinSessionId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Session could not be loaded.");
    }

    const payload = (await response.json()) as SessionPayload;

    setSession(payload.session);
    setResults(payload.results);
    setMessage("Session loaded from the local backend.");
  };

  useEffect(() => {
    loadSession().catch((error: unknown) => {
      setMessage(
        error instanceof Error ? error.message : "Session could not be loaded.",
      );
    });
  }, [pin2WinSessionId]);

  const updateStatus = async (status: SimulatorSessionStatus) => {
    setIsBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/simulator/sessions/${pin2WinSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Status could not be updated.");
      }

      const payload = (await response.json()) as { session: SimulatorSession };

      setSession(payload.session);
      setMessage(`Session marked ${status.toLowerCase().replaceAll("_", " ")}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Status could not be updated.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const saveResult = async () => {
    if (!resultForm.rawResult) {
      setMessage("Enter a verified result before saving.");
      return;
    }

    setIsBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/simulator/sessions/${pin2WinSessionId}/results`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "MANUAL_ENTRY",
            rawResult: resultForm.rawResult,
            resultUnit,
            evidenceUrl: resultForm.evidenceUrl,
            verifierName: resultForm.verifierName,
            notes: resultForm.notes,
            rawPayload: {
              capturedFrom: "operator-session-page",
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Result could not be saved.");
      }

      const payload = (await response.json()) as { result: SimulatorResult };

      setResults((current) => [payload.result, ...current]);
      setSession((current) =>
        current ? { ...current, status: "VERIFIED" } : current,
      );
      setResultForm({
        rawResult: "",
        evidenceUrl: "",
        verifierName: resultForm.verifierName,
        notes: "",
      });
      setMessage("Verified result saved to this test session.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Result could not be saved.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#18211f]">
      <header className="border-b border-[#d7dfd4] bg-white px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-black text-[#2f6b3f]"
              href="/testing-portal"
            >
              <ArrowLeft size={17} /> Testing portal
            </Link>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Operator session
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              {pin2WinSessionId}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-md bg-[#e3edd8] px-4 py-2 text-sm font-black text-[#2f6b3f]">
              {session?.status ?? "Loading"}
            </span>
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7dfd4] bg-white px-4 text-sm font-black text-[#18211f] transition hover:border-[#2f6b3f]"
              href={`/api/simulator/export?format=csv&sessionId=${pin2WinSessionId}`}
            >
              <Download size={16} /> CSV
            </a>
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7dfd4] bg-white px-4 text-sm font-black text-[#18211f] transition hover:border-[#2f6b3f]"
              href={`/api/simulator/export?format=json&sessionId=${pin2WinSessionId}`}
            >
              <Download size={16} /> JSON
            </a>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935]"
              type="button"
              onClick={() =>
                loadSession().catch(() =>
                  setMessage("Session could not be refreshed."),
                )
              }
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:px-10">
        {message ? (
          <p className="rounded-lg border border-[#d7dfd4] bg-white px-5 py-4 text-sm font-black text-[#2f6b3f]">
            {message}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Challenge", challengeLabel(session), Flag],
            ["Provider", providerLabel(session?.provider), Gauge],
            ["Bay", session?.bayName || "Bay not set", ClipboardCheck],
            ["Results", String(results.length), Trophy],
          ].map(([label, value, Icon]) => (
            <div
              key={label as string}
              className="rounded-lg border border-[#d7dfd4] bg-white p-5"
            >
              <Icon className="text-[#2f6b3f]" size={26} />
              <p className="mt-4 text-sm font-black text-[#59655f]">
                {label as string}
              </p>
              <p className="mt-1 text-xl font-black">{value as string}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#d7dfd4] bg-white p-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">Challenge setup</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Venue", session?.venueName || "Not set"],
                ["Bay", session?.bayName || "Not set"],
                ["Player alias", session?.playerAlias || "Not set"],
                ["Operator", session?.operatorName || "Not set"],
                ["Course", session?.course || "Not set"],
                ["Hole", session?.hole ? String(session.hole) : "Not set"],
                ["Tee box", session?.teeBox || "Not set"],
                ["Pin location", session?.pinLocation || "Not set"],
                ["Attempts", session?.attempts ? String(session.attempts) : "Not set"],
                [
                  "Play time",
                  session?.playTimeMinutes
                    ? `${session.playTimeMinutes} min`
                    : "Not set",
                ],
                ["E6 session", session?.e6SessionName || "Not set"],
                ["External ID", session?.e6SessionId || "Not set"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-[#fbfdf9] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                    {label}
                  </p>
                  <p className="mt-2 font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d7dfd4] bg-white p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">Operator workflow</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {statusActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.status}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935] disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={() => updateStatus(action.status)}
                    disabled={isBusy || session?.status === action.status}
                  >
                    <Icon size={17} /> {action.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 grid gap-3">
              {[
                "Confirm the simulator bay is isolated from public customer flow.",
                "Set the challenge options in E6/APOGEE exactly as shown.",
                "Capture screenshot/evidence before submitting the verified result.",
                "Keep this page open until the result appears in the session history.",
              ].map((item, index) => (
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
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#d7dfd4] bg-white p-6">
            <div className="flex items-center gap-3">
              <FileText className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">Verified result</h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Result
                <div className="flex h-12 overflow-hidden rounded-md border border-[#d7dfd4] bg-white focus-within:border-[#2f6b3f]">
                  <input
                    className="min-w-0 flex-1 px-4 text-base text-[#18211f] outline-none"
                    placeholder={resultPlaceholder}
                    value={resultForm.rawResult}
                    onChange={(event) =>
                      setResultForm((current) => ({
                        ...current,
                        rawResult: event.target.value,
                      }))
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
                    setResultForm((current) => ({
                      ...current,
                      verifierName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Evidence
                <input
                  className="h-12 rounded-md border border-[#d7dfd4] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  value={resultForm.evidenceUrl}
                  onChange={(event) =>
                    setResultForm((current) => ({
                      ...current,
                      evidenceUrl: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Notes
                <input
                  className="h-12 rounded-md border border-[#d7dfd4] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  value={resultForm.notes}
                  onChange={(event) =>
                    setResultForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <button
              className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-6 text-sm font-black text-white transition hover:bg-[#3f7f4c] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={saveResult}
              disabled={isBusy}
            >
              <Save size={18} /> Save verified result
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#d7dfd4] bg-white">
            <div className="flex items-center justify-between gap-3 bg-[#18211f] px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <Trophy className="text-[#a8c878]" size={28} />
                <h2 className="text-2xl font-black">Result history</h2>
              </div>
              <Link
                className="inline-flex items-center gap-2 text-sm font-black text-[#a8c878]"
                href="/testing-portal"
              >
                Boards <ExternalLink size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-[64px_1fr_116px] gap-3 bg-[#f2eadb] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
              <span>Rank</span>
              <span>Source</span>
              <span>Result</span>
            </div>
            {sortedResults.length > 0 ? (
              sortedResults.map((result, index) => (
                <div
                  key={result.id}
                  className="grid grid-cols-[64px_1fr_116px] gap-3 border-t border-[#d7dfd4] px-4 py-4 text-sm"
                >
                  <span className="font-black">#{index + 1}</span>
                  <div>
                    <p className="font-black">
                      {result.playerAlias || result.verifierName || "Operator"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#6b756f]">
                      {result.source ?? "MANUAL_ENTRY"} |{" "}
                      {formatDate(result.createdAt)}
                    </p>
                  </div>
                  <span className="font-black text-[#2f6b3f]">
                    {resultDisplay(result)}
                  </span>
                </div>
              ))
            ) : (
              <div className="border-t border-[#d7dfd4] px-4 py-5 text-sm font-bold text-[#6b756f]">
                No verified results have been saved for this session.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
