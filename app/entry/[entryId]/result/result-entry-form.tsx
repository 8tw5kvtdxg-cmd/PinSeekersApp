"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, RefreshCw, Save } from "lucide-react";

type ResultEntryFormProps = {
  entryId: string;
  playerName: string;
  simulatorUsername: string;
  existingEvidence: string;
  existingResult: string;
  existingStatus: string;
};

export function ResultEntryForm({
  entryId,
  playerName,
  simulatorUsername,
  existingEvidence,
  existingResult,
  existingStatus,
}: ResultEntryFormProps) {
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [evidence, setEvidence] = useState(existingEvidence);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(existingResult);

  async function submitResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/clubhouse/entries/${entryId}/result`, {
        body: JSON.stringify({ feet, inches, evidence }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as {
        entry?: { result?: string; resultStatus?: string };
        error?: string;
      };

      if (!response.ok || !data.entry) {
        throw new Error(data.error ?? "Could not submit your result.");
      }

      setSubmittedResult(data.entry.result ?? "");
      setMessage(
        "Result submitted for Pin2Win review. You can try again with a new entry when you are ready.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not submit your result.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-0 lg:grid-cols-[1fr_0.78fr]">
      <form className="grid gap-5 p-6 sm:p-8" onSubmit={submitResult}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]"
              htmlFor="feet"
            >
              Feet
            </label>
            <input
              id="feet"
              inputMode="decimal"
              min="0"
              required
              type="number"
              value={feet}
              onChange={(event) => setFeet(event.target.value)}
              className="mt-2 h-12 w-full rounded-md border border-[#d8cfbf] bg-white px-3 text-base font-bold outline-none focus:border-[#2f6b3f]"
            />
          </div>
          <div>
            <label
              className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]"
              htmlFor="inches"
            >
              Inches
            </label>
            <input
              id="inches"
              inputMode="decimal"
              min="0"
              required
              step="0.01"
              type="number"
              value={inches}
              onChange={(event) => setInches(event.target.value)}
              className="mt-2 h-12 w-full rounded-md border border-[#d8cfbf] bg-white px-3 text-base font-bold outline-none focus:border-[#2f6b3f]"
            />
          </div>
        </div>

        <div>
          <label
            className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]"
            htmlFor="evidence"
          >
            Notes or evidence
          </label>
          <textarea
            id="evidence"
            value={evidence}
            onChange={(event) => setEvidence(event.target.value)}
            placeholder="Example: Bay 1, Hole 7, screenshot saved on simulator."
            className="mt-2 min-h-28 w-full rounded-md border border-[#d8cfbf] bg-white px-3 py-3 text-base font-bold outline-none focus:border-[#2f6b3f]"
          />
        </div>

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
          disabled={isSaving}
          type="submit"
        >
          <Save size={18} /> {isSaving ? "Submitting..." : "Submit result"}
        </button>
      </form>

      <aside className="border-t border-[#ece5d8] bg-[#fbf8f1] p-6 sm:p-8 lg:border-l lg:border-t-0">
        <h2 className="text-xl font-black">Entry details</h2>
        <dl className="mt-5 grid gap-4">
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
              Player
            </dt>
            <dd className="mt-1 font-black">{playerName}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
              Simulator username
            </dt>
            <dd className="mt-1 font-black">{simulatorUsername}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
              Status
            </dt>
            <dd className="mt-1 font-black">
              {submittedResult ? "Needs Review" : existingStatus}
            </dd>
          </div>
          {submittedResult ? (
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                Submitted result
              </dt>
              <dd className="mt-1 font-black">{submittedResult}</dd>
            </div>
          ) : null}
        </dl>

        {message ? (
          <div className="mt-6 rounded-md border border-[#d8cfbf] bg-white p-4">
            <CheckCircle2 className="text-[#2f6b3f]" size={24} />
            <h3 className="mt-3 font-black">Want to try again?</h3>
            <p className="mt-2 text-sm leading-6 text-[#59655f]">
              Start a new paid entry from the partner location QR code when you
              are ready for another attempt.
            </p>
            <Link
              href="/locations"
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white"
            >
              <RefreshCw size={16} /> Try again
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
