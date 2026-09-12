"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

type ResultEntryFormProps = {
  entryId: string;
  playerName: string;
  simulatorUsername: string;
  existingEvidence: string;
  existingResult: string;
  existingStatus: string;
  existingSessionId?: string;
  existingShotId?: string;
  existingOccurredAt?: string;
  existingIsHoleInOne?: boolean;
};

export function ResultEntryForm({
  entryId,
  playerName,
  simulatorUsername,
  existingEvidence,
  existingResult,
  existingStatus,
  existingSessionId,
  existingShotId,
  existingOccurredAt,
  existingIsHoleInOne,
}: ResultEntryFormProps) {
  const [simulatorSessionId, setSimulatorSessionId] = useState(existingSessionId ?? "");
  const [simulatorShotId, setSimulatorShotId] = useState(existingShotId ?? "");
  const [resultOccurredAt, setResultOccurredAt] = useState(
    existingOccurredAt ? existingOccurredAt.slice(0, 16) : "",
  );
  const [evidence, setEvidence] = useState(existingEvidence);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(
    existingIsHoleInOne ? existingResult : "",
  );

  async function submitResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const sourceDate = new Date(resultOccurredAt);

      if (Number.isNaN(sourceDate.getTime())) {
        throw new Error("Enter the exact date and time recorded by the simulator.");
      }

      const response = await fetch(`/api/clubhouse/entries/${entryId}/result`, {
        body: JSON.stringify({
          evidence,
          isHoleInOne: confirmed,
          resultOccurredAt: sourceDate.toISOString(),
          simulatorSessionId,
          simulatorShotId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as {
        entry?: { result?: string };
        error?: string;
      };

      if (!response.ok || !data.entry) {
        throw new Error(data.error ?? "Could not report the hole-in-one.");
      }

      setSubmittedResult(data.entry.result ?? "Hole-in-one reported");
      setMessage(
        "Your hole-in-one was reported for verification. New sales are paused while Pin2Win reviews the simulator record.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not report the hole-in-one.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const hasSubmitted = Boolean(submittedResult);

  return (
    <div className="grid gap-0 lg:grid-cols-[1fr_0.78fr]">
      <form className="grid gap-5 p-6 sm:p-8" onSubmit={submitResult}>
        <div className="rounded-md border border-[#efd19e] bg-[#fff8e8] p-4 text-sm leading-6 text-[#684718]">
          <p className="font-black">Report only an actual hole-in-one.</p>
          <p className="mt-1">
            A report pauses new entry sales immediately. Pin2Win will compare it
            with the original simulator record before approving a winner.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
              Simulator session ID
            </span>
            <input
              className="h-12 rounded-md border border-[#d8cfbf] bg-white px-3 font-bold outline-none focus:border-[#2f6b3f]"
              disabled={hasSubmitted}
              required
              value={simulatorSessionId}
              onChange={(event) => setSimulatorSessionId(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
              Simulator shot ID
            </span>
            <input
              className="h-12 rounded-md border border-[#d8cfbf] bg-white px-3 font-bold outline-none focus:border-[#2f6b3f]"
              disabled={hasSubmitted}
              required
              value={simulatorShotId}
              onChange={(event) => setSimulatorShotId(event.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
            Exact simulator date and time
          </span>
          <input
            className="h-12 rounded-md border border-[#d8cfbf] bg-white px-3 font-bold outline-none focus:border-[#2f6b3f]"
            disabled={hasSubmitted}
            required
            type="datetime-local"
            value={resultOccurredAt}
            onChange={(event) => setResultOccurredAt(event.target.value)}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
            Evidence reference
          </span>
          <textarea
            className="min-h-28 rounded-md border border-[#d8cfbf] bg-white px-3 py-3 font-bold outline-none focus:border-[#2f6b3f]"
            disabled={hasSubmitted}
            required
            value={evidence}
            onChange={(event) => setEvidence(event.target.value)}
            placeholder="Screenshot URL or file reference, simulator record details, bay, and hole."
          />
        </label>

        <label className="flex items-start gap-3 rounded-md border border-[#d8cfbf] p-4 text-sm font-bold leading-6">
          <input
            checked={confirmed}
            className="mt-1 size-4 accent-[#2f6b3f]"
            disabled={hasSubmitted}
            required
            type="checkbox"
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          I confirm the simulator recorded this eligible shot as a hole-in-one
          and that the identifiers and source time above are accurate.
        </label>

        {error ? (
          <p className="rounded-md bg-[#fff2ed] px-4 py-3 text-sm font-bold text-[#8d2f1f]">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-md bg-[#eef4e7] px-4 py-3 text-sm font-bold text-[#2f6b3f]">
            {message}
          </p>
        ) : null}

        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935] disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
          disabled={isSaving || hasSubmitted}
          type="submit"
        >
          <AlertTriangle size={18} />
          {isSaving ? "Reporting..." : hasSubmitted ? "Report submitted" : "Report hole-in-one"}
        </button>
      </form>

      <aside className="border-t border-[#ece5d8] bg-[#fbf8f1] p-6 sm:p-8 lg:border-l lg:border-t-0">
        <h2 className="text-xl font-black">Entry details</h2>
        <dl className="mt-5 grid gap-4">
          <div><dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">Player</dt><dd className="mt-1 font-black">{playerName}</dd></div>
          <div><dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">Simulator username</dt><dd className="mt-1 font-black">{simulatorUsername}</dd></div>
          <div><dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">Status</dt><dd className="mt-1 font-black">{hasSubmitted ? "Needs Review" : existingStatus}</dd></div>
        </dl>

        {hasSubmitted ? (
          <div className="mt-6 rounded-md border border-[#d8cfbf] bg-white p-4">
            <CheckCircle2 className="text-[#2f6b3f]" size={24} />
            <h3 className="mt-3 font-black">Claim recorded</h3>
            <p className="mt-2 text-sm leading-6 text-[#59655f]">
              Do not submit another paid entry while this claim is under review.
            </p>
            <Link href="/locations" className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8cfbf] px-4 text-sm font-black">
              <RefreshCw size={16} /> Locations
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
