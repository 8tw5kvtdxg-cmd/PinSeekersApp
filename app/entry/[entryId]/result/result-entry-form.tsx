"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";

export function ResultEntryForm({
  entryId,
  playerName,
  simulatorUsername,
  existingReport,
}: {
  entryId: string;
  playerName: string;
  simulatorUsername: string;
  existingReport?: { id: string; status: string };
}) {
  const [statement, setStatement] = useState("");
  const [firstStrokeHoled, setFirstStrokeHoled] = useState(false);
  const [report, setReport] = useState(existingReport);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submitResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/clubhouse/entries/${entryId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstStrokeHoled, statement }),
      });
      const data = (await response.json()) as {
        report?: { id: string; status: string };
        error?: string;
      };
      if (!response.ok || !data.report) throw new Error(data.error ?? "Could not submit the report.");
      setReport(data.report);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not submit the report.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-0 lg:grid-cols-[1fr_0.78fr]">
      <div className="p-6 sm:p-8">
        {report ? (
          <div className="rounded-lg border border-[#d8cfbf] bg-[#eef4e7] p-5">
            <CheckCircle2 size={26} className="text-[#2f6b3f]" />
            <h2 className="mt-3 text-xl font-black">Potential result received</h2>
            <p className="mt-2 text-sm leading-6">Report {report.id} is {report.status.toLowerCase()}. It is not a verified result or a prize claim. Pin2Win will compare it with the authenticated simulator record and other evidence.</p>
          </div>
        ) : (
          <form className="grid gap-5" onSubmit={submitResult}>
            <label className="flex items-start gap-3 text-sm font-bold leading-6">
              <input
                type="checkbox" required checked={firstStrokeHoled}
                onChange={(event) => setFirstStrokeHoled(event.target.checked)}
                className="mt-1 h-5 w-5"
              />
              The authorized simulator recorded the ball holed from the designated tee in one eligible stroke.
            </label>
            <div>
              <label htmlFor="statement" className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">What happened and where is the simulator evidence?</label>
              <textarea
                id="statement" required maxLength={2000} value={statement}
                onChange={(event) => setStatement(event.target.value)}
                placeholder="Include the venue, bay, simulator session, approximate time, and screenshot or video reference. Do not include identity or tax documents."
                className="mt-2 min-h-36 w-full rounded-md border border-[#d8cfbf] bg-white px-3 py-3 text-base font-bold outline-none focus:border-[#2f6b3f]"
              />
            </div>
            <p className="text-sm leading-6 text-[#59655f]">A report temporarily pauses new challenge sales while an administrator reviews it. Reporting a result does not verify it or guarantee a prize.</p>
            {error && <p className="rounded-md bg-[#fff2ed] px-4 py-3 text-sm font-bold text-[#8d2f1f]">{error}</p>}
            <button type="submit" disabled={isSaving} className="inline-flex h-12 w-fit items-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white disabled:opacity-60">
              <Save size={18} /> {isSaving ? "Submitting…" : "Report potential hole-in-one"}
            </button>
          </form>
        )}
      </div>
      <aside className="border-t border-[#ece5d8] bg-[#fbf8f1] p-6 sm:p-8 lg:border-l lg:border-t-0">
        <h2 className="text-xl font-black">Entry details</h2>
        <dl className="mt-5 grid gap-4">
          <div><dt className="text-xs font-black uppercase text-[#87908a]">Player</dt><dd className="mt-1 font-black">{playerName}</dd></div>
          <div><dt className="text-xs font-black uppercase text-[#87908a]">Simulator username</dt><dd className="mt-1 font-black">{simulatorUsername}</dd></div>
          <div><dt className="text-xs font-black uppercase text-[#87908a]">Report status</dt><dd className="mt-1 font-black">{report?.status ?? "No report"}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
