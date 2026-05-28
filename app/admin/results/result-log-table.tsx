"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Save } from "lucide-react";
import type { ClubhouseChallenge } from "@/lib/clubhouse";
import type { ClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";
import { normalizeChallengeSlug } from "@/lib/clubhouse";

type ResultLogTableProps = {
  challenge: ClubhouseChallenge;
  initialEntries: ClubhouseEntryRecord[];
};

type ResultDraft = {
  result: string;
  resultValue: string;
  resultStatus: ClubhouseEntryRecord["resultStatus"];
  evidence: string;
};

const statusOptions: ClubhouseEntryRecord["resultStatus"][] = [
  "Pending E6 Result",
  "Needs Review",
  "Verified",
  "Rejected",
];

function resultUnitForChallenge(challenge: ClubhouseChallenge) {
  return challenge.type === "CLOSEST_TO_PIN" ? "inches" : "yards";
}

function resultHelpText(challenge: ClubhouseChallenge) {
  if (challenge.type === "CLOSEST_TO_PIN") {
    return "Display example: 3 ft 2 in. Sort value: total inches, lower wins.";
  }

  return "Display example: 312 yd. Sort value: yards, higher wins.";
}

export function ResultLogTable({
  challenge,
  initialEntries,
}: ResultLogTableProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [drafts, setDrafts] = useState<Record<string, ResultDraft>>(() =>
    Object.fromEntries(
      initialEntries.map((entry) => [
        entry.id,
        {
          result: entry.result ?? "",
          resultValue:
            typeof entry.resultValue === "number" ? String(entry.resultValue) : "",
          resultStatus: entry.resultStatus,
          evidence: entry.evidence ?? "",
        },
      ]),
    ),
  );
  const [savingEntryId, setSavingEntryId] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorByEntryId, setErrorByEntryId] = useState<Record<string, string>>({});
  const [tableError, setTableError] = useState("");
  const resultUnit = resultUnitForChallenge(challenge);
  const visibleEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          normalizeChallengeSlug(entry.challengeSlug) === challenge.slug &&
          entry.paymentStatus === "Succeeded",
      ),
    [challenge.slug, entries],
  );

  function mergeDrafts(nextEntries: ClubhouseEntryRecord[]) {
    setDrafts((current) => ({
      ...Object.fromEntries(
        nextEntries.map((entry) => [
          entry.id,
          {
            result: entry.result ?? "",
            resultValue:
              typeof entry.resultValue === "number" ? String(entry.resultValue) : "",
            resultStatus: entry.resultStatus,
            evidence: entry.evidence ?? "",
          },
        ]),
      ),
      ...current,
    }));
  }

  async function refreshEntries() {
    setIsRefreshing(true);
    setTableError("");

    try {
      const response = await fetch("/api/clubhouse/entries", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not refresh paid entries.");
      }

      const data = (await response.json()) as {
        entries?: ClubhouseEntryRecord[];
      };
      const nextEntries = data.entries ?? [];

      setEntries(nextEntries);
      mergeDrafts(nextEntries);
    } catch (error) {
      setTableError(
        error instanceof Error ? error.message : "Could not refresh paid entries.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const interval = window.setInterval(refreshEntries, 3000);

    return () => window.clearInterval(interval);
  }, []);

  function updateDraft(entryId: string, nextDraft: Partial<ResultDraft>) {
    setDrafts((current) => ({
      ...current,
      [entryId]: Object.assign(
        {
          result: "",
          resultValue: "",
          resultStatus: "Pending E6 Result" as const,
          evidence: "",
        },
        current[entryId],
        nextDraft,
      ),
    }));
  }

  async function saveResult(entryId: string) {
    const draft = drafts[entryId];

    if (!draft) {
      return;
    }

    setSavingEntryId(entryId);
    setErrorByEntryId((current) => ({ ...current, [entryId]: "" }));

    try {
      const response = await fetch(`/api/clubhouse/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: draft.result,
          resultValue: Number(draft.resultValue),
          resultUnit,
          resultStatus: draft.resultStatus,
          evidence: draft.evidence,
        }),
      });
      const data = (await response.json()) as {
        entry?: ClubhouseEntryRecord;
        error?: string;
      };

      if (!response.ok || !data.entry) {
        throw new Error(data.error ?? "Could not save result.");
      }

      setEntries((current) =>
        current.map((entry) => (entry.id === data.entry?.id ? data.entry : entry)),
      );
    } catch (error) {
      setErrorByEntryId((current) => ({
        ...current,
        [entryId]:
          error instanceof Error ? error.message : "Could not save result.",
      }));
    } finally {
      setSavingEntryId("");
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
      <div className="flex flex-col gap-4 bg-[#18211f] px-5 py-4 text-white sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">{challenge.name}</h2>
          <p className="mt-1 text-sm font-bold text-white/66">
            {resultHelpText(challenge)}
          </p>
          {tableError ? (
            <p className="mt-2 text-xs font-bold text-[#ffd0c7]">
              {tableError}
            </p>
          ) : null}
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-xs font-black text-[#18211f] transition hover:bg-[#f5efdf] disabled:cursor-not-allowed disabled:bg-white/70"
          disabled={isRefreshing}
          type="button"
          onClick={refreshEntries}
        >
          <RefreshCw size={15} />
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="mx-auto text-[#2f6b3f]" size={34} />
          <h3 className="mt-4 text-xl font-black">No paid entries yet</h3>
          <p className="mt-3 text-sm leading-6 text-[#59655f]">
            Paid entries for this challenge will appear here after checkout.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#f2eadb] text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
              <tr>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">E6 Username</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Sort Value</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Evidence / Notes</th>
                <th className="px-4 py-3">Save</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((entry) => {
                const draft = drafts[entry.id] ?? {
                  result: entry.result ?? "",
                  resultValue:
                    typeof entry.resultValue === "number"
                      ? String(entry.resultValue)
                      : "",
                  resultStatus: entry.resultStatus,
                  evidence: entry.evidence ?? "",
                };
                const isSaving = savingEntryId === entry.id;

                return (
                  <tr key={entry.id} className="border-t border-[#ece5d8]">
                    <td className="px-4 py-4 align-top font-black">{entry.id}</td>
                    <td className="px-4 py-4 align-top font-bold">
                      {entry.playerName}
                    </td>
                    <td className="px-4 py-4 align-top font-bold text-[#59655f]">
                      {entry.phoneNumber ?? "Not provided"}
                    </td>
                    <td className="px-4 py-4 align-top font-bold text-[#59655f]">
                      {entry.e6DisplayName}
                    </td>
                    <td className="px-4 py-4 align-top text-[#59655f]">
                      {entry.paidAt}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <input
                        className="h-10 w-36 rounded-md border border-[#ded6c8] px-3 outline-none focus:border-[#2f6b3f]"
                        placeholder={
                          challenge.type === "CLOSEST_TO_PIN"
                            ? "3 ft 2 in"
                            : "312 yd"
                        }
                        value={draft.result}
                        onChange={(event) =>
                          updateDraft(entry.id, { result: event.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <input
                          className="h-10 w-24 rounded-md border border-[#ded6c8] px-3 outline-none focus:border-[#2f6b3f]"
                          min="0"
                          step="0.01"
                          type="number"
                          value={draft.resultValue}
                          onChange={(event) =>
                            updateDraft(entry.id, {
                              resultValue: event.target.value,
                            })
                          }
                        />
                        <span className="text-xs font-black uppercase text-[#87908a]">
                          {resultUnit === "inches" ? "in" : "yd"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <select
                        className="h-10 rounded-md border border-[#ded6c8] bg-white px-3 font-bold outline-none focus:border-[#2f6b3f]"
                        value={draft.resultStatus}
                        onChange={(event) =>
                          updateDraft(entry.id, {
                            resultStatus: event.target
                              .value as ClubhouseEntryRecord["resultStatus"],
                          })
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <input
                        className="h-10 w-56 rounded-md border border-[#ded6c8] px-3 outline-none focus:border-[#2f6b3f]"
                        placeholder="Leaderboard note or evidence"
                        value={draft.evidence}
                        onChange={(event) =>
                          updateDraft(entry.id, { evidence: event.target.value })
                        }
                      />
                      {errorByEntryId[entry.id] ? (
                        <p className="mt-2 text-xs font-bold text-[#9a3324]">
                          {errorByEntryId[entry.id]}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <button
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-xs font-black text-white transition hover:bg-[#2a3935] disabled:cursor-not-allowed disabled:bg-[#ded6c8] disabled:text-[#6b756f]"
                        disabled={isSaving}
                        type="button"
                        onClick={() => saveResult(entry.id)}
                      >
                        <Save size={15} />
                        {isSaving ? "Saving" : "Save"}
                      </button>
                    </td>
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
