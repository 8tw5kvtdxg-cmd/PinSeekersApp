"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, ShieldCheck, Trash2, XCircle } from "lucide-react";
import type { ClubhouseChallenge } from "@/lib/clubhouse";
import { normalizeChallengeSlug } from "@/lib/clubhouse";
import type { ClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";

type ResultLogTableProps = {
  challenge: ClubhouseChallenge;
  initialEntries: ClubhouseEntryRecord[];
};

type ReviewDraft = {
  verificationNote: string;
  chronologyUndeterminable: boolean;
};

const autoRefreshIntervalMs = 15000;

function formatSourceTime(value?: string) {
  if (!value) return "Not supplied";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString();
}

export function ResultLogTable({ challenge, initialEntries }: ResultLogTableProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [workingEntryId, setWorkingEntryId] = useState("");
  const [deletingEntryId, setDeletingEntryId] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorByEntryId, setErrorByEntryId] = useState<Record<string, string>>({});
  const [tableError, setTableError] = useState("");

  const visibleEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          normalizeChallengeSlug(entry.challengeSlug) === challenge.slug &&
          entry.paymentStatus === "Succeeded",
      ),
    [challenge.slug, entries],
  );

  async function refreshEntries(showState = false) {
    if (showState) setIsRefreshing(true);
    setTableError("");

    try {
      const response = await fetch("/api/clubhouse/entries", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not refresh registered entries.");
      const data = (await response.json()) as { entries?: ClubhouseEntryRecord[] };
      setEntries(data.entries ?? []);
    } catch (error) {
      setTableError(error instanceof Error ? error.message : "Could not refresh entries.");
    } finally {
      if (showState) setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const interval = window.setInterval(() => void refreshEntries(), autoRefreshIntervalMs);
    return () => window.clearInterval(interval);
  }, []);

  function updateDraft(entryId: string, update: Partial<ReviewDraft>) {
    setDrafts((current) => ({
      ...current,
      [entryId]: {
        ...(current[entryId] ?? {
          chronologyUndeterminable: false,
          verificationNote: "",
        }),
        ...update,
      },
    }));
  }

  async function review(entryId: string, action: "verify-hole-in-one" | "reject-hole-in-one") {
    const draft = drafts[entryId] ?? {
      chronologyUndeterminable: false,
      verificationNote: "",
    };
    setWorkingEntryId(entryId);
    setErrorByEntryId((current) => ({ ...current, [entryId]: "" }));

    try {
      const response = await fetch(`/api/clubhouse/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...draft }),
      });
      const data = (await response.json()) as { entry?: ClubhouseEntryRecord; error?: string };
      if (!response.ok || !data.entry) throw new Error(data.error ?? "Could not save review.");
      setEntries((current) => current.map((entry) => (entry.id === entryId ? data.entry! : entry)));
      setDrafts((current) => ({ ...current, [entryId]: { ...draft, verificationNote: "" } }));
    } catch (error) {
      setErrorByEntryId((current) => ({
        ...current,
        [entryId]: error instanceof Error ? error.message : "Could not save review.",
      }));
    } finally {
      setWorkingEntryId("");
    }
  }

  async function deleteEntry(entryId: string) {
    if (!window.confirm(`Delete entry ${entryId}?`)) return;
    setDeletingEntryId(entryId);
    try {
      const response = await fetch(`/api/clubhouse/entries/${entryId}`, { method: "DELETE" });
      const data = (await response.json()) as { deleted?: boolean; error?: string };
      if (!response.ok || !data.deleted) throw new Error(data.error ?? "Could not delete entry.");
      setEntries((current) => current.filter((entry) => entry.id !== entryId));
    } catch (error) {
      setErrorByEntryId((current) => ({
        ...current,
        [entryId]: error instanceof Error ? error.message : "Could not delete entry.",
      }));
    } finally {
      setDeletingEntryId("");
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
      <div className="flex flex-col gap-4 bg-[#18211f] px-5 py-4 text-white sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">{challenge.name}</h2>
          <p className="mt-1 max-w-3xl text-sm font-bold text-white/66">
            Review actual hole-in-one claims against the original simulator record. Sales remain paused until every pending claim is decided.
          </p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#a8c878]">
            {visibleEntries.filter((entry) => entry.resultStatus === "Needs Review" && entry.isHoleInOne).length} pending claim(s)
          </p>
          {tableError ? <p className="mt-2 text-xs font-bold text-[#ffd0c7]">{tableError}</p> : null}
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-xs font-black text-[#18211f] disabled:opacity-60" disabled={isRefreshing} type="button" onClick={() => refreshEntries(true)}>
          <RefreshCw size={15} /> {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="p-8 text-center"><CheckCircle2 className="mx-auto text-[#2f6b3f]" size={34} /><h3 className="mt-4 text-xl font-black">No registered entries yet</h3></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
            <thead className="bg-[#f2eadb] text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
              <tr>
                <th className="px-4 py-3">Entry / player</th>
                <th className="px-4 py-3">Claim</th>
                <th className="px-4 py-3">Source time</th>
                <th className="px-4 py-3">Simulator IDs</th>
                <th className="px-4 py-3">Original evidence</th>
                <th className="px-4 py-3">Verification note</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Delete</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((entry) => {
                const draft = drafts[entry.id] ?? { chronologyUndeterminable: false, verificationNote: "" };
                const isPendingClaim = entry.isHoleInOne === true && entry.resultStatus === "Needs Review";
                const isWorking = workingEntryId === entry.id;
                return (
                  <tr key={entry.id} className="border-t border-[#ece5d8]">
                    <td className="px-4 py-4 align-top"><p className="font-black">{entry.playerName}</p><p className="mt-1 text-xs text-[#59655f]">{entry.id}</p><p className="mt-1 text-xs text-[#59655f]">{entry.e6DisplayName}</p></td>
                    <td className="px-4 py-4 align-top"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${isPendingClaim ? "bg-[#fff0cf] text-[#79500e]" : entry.resultStatus === "Verified" ? "bg-[#e3edd8] text-[#2f6b3f]" : entry.resultStatus === "Rejected" ? "bg-[#fff2ed] text-[#9a3324]" : "bg-[#eef0ee] text-[#59655f]"}`}>{entry.isHoleInOne ? entry.resultStatus : "No claim"}</span>{entry.resultVerifiedBy ? <p className="mt-2 text-xs text-[#59655f]">By {entry.resultVerifiedBy}<br />{formatSourceTime(entry.resultVerifiedAt)}</p> : null}</td>
                    <td className="px-4 py-4 align-top font-bold">{formatSourceTime(entry.resultOccurredAt)}</td>
                    <td className="px-4 py-4 align-top text-xs"><p><strong>Session:</strong> {entry.simulatorSessionId ?? "—"}</p><p className="mt-2"><strong>Shot:</strong> {entry.simulatorShotId ?? "—"}</p></td>
                    <td className="max-w-xs px-4 py-4 align-top whitespace-pre-wrap text-[#59655f]">{entry.evidence ?? "—"}</td>
                    <td className="px-4 py-4 align-top">
                      {isPendingClaim ? <><textarea className="min-h-24 w-64 rounded-md border border-[#ded6c8] p-3 font-bold outline-none focus:border-[#2f6b3f]" placeholder="Required: how the original record was verified" value={draft.verificationNote} onChange={(event) => updateDraft(entry.id, { verificationNote: event.target.value })} /><label className="mt-3 flex w-64 items-start gap-2 text-xs font-bold text-[#59655f]"><input className="mt-0.5" type="checkbox" checked={draft.chronologyUndeterminable} onChange={(event) => updateDraft(entry.id, { chronologyUndeterminable: event.target.checked })} />Chronology cannot be reliably determined; apply equal split among verified claims.</label></> : <p className="w-64 text-[#59655f]">{entry.resultVerificationNote ?? "—"}</p>}
                      {errorByEntryId[entry.id] ? <p className="mt-2 w-64 text-xs font-bold text-[#9a3324]">{errorByEntryId[entry.id]}</p> : null}
                    </td>
                    <td className="px-4 py-4 align-top"><div className="grid gap-2"><button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-4 text-xs font-black text-white disabled:opacity-40" disabled={!isPendingClaim || isWorking} type="button" onClick={() => review(entry.id, "verify-hole-in-one")}><ShieldCheck size={15} /> Verify</button><button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#f0c9c1] bg-[#fff5f2] px-4 text-xs font-black text-[#9a3324] disabled:opacity-40" disabled={!isPendingClaim || isWorking} type="button" onClick={() => review(entry.id, "reject-hole-in-one")}><XCircle size={15} /> Reject</button></div></td>
                    <td className="px-4 py-4 align-top"><button aria-label={`Delete ${entry.id}`} className="inline-flex size-10 items-center justify-center rounded-md border border-[#f0c9c1] text-[#9a3324] disabled:opacity-40" disabled={deletingEntryId === entry.id || entry.isHoleInOne === true} title={entry.isHoleInOne ? "Claim records must be retained" : "Delete entry"} type="button" onClick={() => deleteEntry(entry.id)}><Trash2 size={16} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
