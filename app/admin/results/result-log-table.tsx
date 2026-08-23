"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Save, Trash2 } from "lucide-react";
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

const autoRefreshIntervalMs = 15000;

function resultStatusLabel(status: ClubhouseEntryRecord["resultStatus"]) {
  return status === "Pending E6 Result" ? "Pending Simulator Result" : status;
}

function resultUnitForChallenge(challenge: ClubhouseChallenge) {
  return challenge.type === "HOLE_IN_ONE" ? "inches" : "yards";
}

function resultHelpText(challenge: ClubhouseChallenge) {
  if (challenge.type === "HOLE_IN_ONE") {
    return "Registered entries appear automatically. Enter feet and inches later; lower total distance wins.";
  }

  return "Registered entries appear automatically. Enter a result later using yards as the sort value; higher wins.";
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function closestPartsFromTotal(totalValue: string) {
  const total = Number(totalValue);

  if (!totalValue.trim() || !Number.isFinite(total) || total < 0) {
    return { feet: "", inches: "" };
  }

  const feet = Math.floor(total / 12);
  const inches = total - feet * 12;

  return {
    feet: String(feet),
    inches: formatNumber(inches),
  };
}

function closestResultFromParts(feetValue: string, inchesValue: string) {
  const hasFeet = feetValue.trim() !== "";
  const hasInches = inchesValue.trim() !== "";

  if (!hasFeet && !hasInches) {
    return null;
  }

  const feet = hasFeet ? Number(feetValue) : 0;
  const inches = hasInches ? Number(inchesValue) : 0;

  if (
    !Number.isFinite(feet) ||
    !Number.isFinite(inches) ||
    feet < 0 ||
    inches < 0
  ) {
    return null;
  }

  const totalInches = feet * 12 + inches;
  const result = `${formatNumber(feet)} ft ${formatNumber(inches)} in`;

  return {
    result,
    resultValue: formatNumber(totalInches),
  };
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
  const [deletingEntryId, setDeletingEntryId] = useState("");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
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

  async function refreshEntries(showButtonState = false) {
    if (showButtonState) {
      setIsManualRefreshing(true);
    }

    setTableError("");

    try {
      const response = await fetch("/api/clubhouse/entries", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not refresh registered entries.");
      }

      const data = (await response.json()) as {
        entries?: ClubhouseEntryRecord[];
      };
      const nextEntries = data.entries ?? [];

      setEntries(nextEntries);
      mergeDrafts(nextEntries);
    } catch (error) {
      setTableError(
        error instanceof Error ? error.message : "Could not refresh registered entries.",
      );
    } finally {
      if (showButtonState) {
        setIsManualRefreshing(false);
      }
    }
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshEntries();
    }, autoRefreshIntervalMs);

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

  function resultStatusForSave(draft: ResultDraft) {
    const hasResult = draft.result.trim();
    const hasSortValue =
      draft.resultValue.trim() && Number.isFinite(Number(draft.resultValue));

    if (
      hasResult &&
      hasSortValue &&
      draft.resultStatus === "Pending E6 Result"
    ) {
      return "Verified";
    }

    return draft.resultStatus;
  }

  function updateClosestResult(
    entryId: string,
    draft: ResultDraft,
    field: "feet" | "inches",
    value: string,
  ) {
    const currentParts = closestPartsFromTotal(draft.resultValue);
    const nextParts = {
      ...currentParts,
      [field]: value,
    };
    const nextResult = closestResultFromParts(
      nextParts.feet,
      nextParts.inches,
    );

    if (!nextResult) {
      updateDraft(entryId, {
        result: "",
        resultValue: "",
        resultStatus: draft.resultStatus,
      });
      return;
    }

    updateDraft(entryId, {
      result: nextResult.result,
      resultValue: nextResult.resultValue,
      resultStatus:
        draft.resultStatus === "Pending E6 Result" ? "Verified" : draft.resultStatus,
    });
  }

  function updateLongDriveResult(entryId: string, draft: ResultDraft, value: string) {
    const yards = Number(value);
    const isValidDistance =
      value.trim() !== "" && Number.isFinite(yards) && yards >= 0;

    updateDraft(entryId, {
      result: isValidDistance ? `${formatNumber(yards)} yd` : "",
      resultValue: value,
      resultStatus:
        draft.resultStatus === "Pending E6 Result" && isValidDistance
          ? "Verified"
          : draft.resultStatus,
    });
  }

  async function saveResult(entryId: string) {
    const draft = drafts[entryId];

    if (!draft) {
      return;
    }

    setSavingEntryId(entryId);
    setErrorByEntryId((current) => ({ ...current, [entryId]: "" }));

    try {
      const resultStatus = resultStatusForSave(draft);
      const response = await fetch(`/api/clubhouse/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: draft.result,
          resultValue: Number(draft.resultValue),
          resultUnit,
          resultStatus,
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

      const savedEntry = data.entry;

      setEntries((current) =>
        current.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry)),
      );
      setDrafts((current) => ({
        ...current,
        [savedEntry.id]: {
          result: savedEntry.result ?? "",
          resultValue:
            typeof savedEntry.resultValue === "number"
              ? String(savedEntry.resultValue)
              : "",
          resultStatus: savedEntry.resultStatus,
          evidence: savedEntry.evidence ?? "",
        },
      }));
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

  async function deleteEntry(entryId: string) {
    const confirmed = window.confirm(
      `Delete entry ${entryId}? This removes it from the result log and verified results.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingEntryId(entryId);
    setErrorByEntryId((current) => ({ ...current, [entryId]: "" }));

    try {
      const response = await fetch(`/api/clubhouse/entries/${entryId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as {
        deleted?: boolean;
        error?: string;
      };

      if (!response.ok || !data.deleted) {
        throw new Error(data.error ?? "Could not delete entry.");
      }

      setEntries((current) => current.filter((entry) => entry.id !== entryId));
      setDrafts((current) => {
        const nextDrafts = { ...current };

        delete nextDrafts[entryId];

        return nextDrafts;
      });
    } catch (error) {
      setErrorByEntryId((current) => ({
        ...current,
        [entryId]:
          error instanceof Error ? error.message : "Could not delete entry.",
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
          <p className="mt-1 text-sm font-bold text-white/66">
            {resultHelpText(challenge)}
          </p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#a8c878]">
            {visibleEntries.length} booking-registered entrant
            {visibleEntries.length === 1 ? "" : "s"} logged
          </p>
          {tableError ? (
            <p className="mt-2 text-xs font-bold text-[#ffd0c7]">
              {tableError}
            </p>
          ) : null}
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-xs font-black text-[#18211f] transition hover:bg-[#f5efdf] disabled:cursor-not-allowed disabled:bg-white/70"
          disabled={isManualRefreshing}
          type="button"
          onClick={() => refreshEntries(true)}
        >
          <RefreshCw size={15} />
          {isManualRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="mx-auto text-[#2f6b3f]" size={34} />
          <h3 className="mt-4 text-xl font-black">No registered entries yet</h3>
          <p className="mt-3 text-sm leading-6 text-[#59655f]">
            Venue-booked entries for this challenge will appear here after QR registration.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1240px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#f2eadb] text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
              <tr>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Simulator Username</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Registered</th>
                {challenge.type === "HOLE_IN_ONE" ? (
                  <>
                    <th className="px-4 py-3">Feet</th>
                    <th className="px-4 py-3">Inches</th>
                  </>
                ) : (
                  <th className="px-4 py-3">Distance</th>
                )}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Evidence / Notes</th>
                <th className="px-4 py-3">Save</th>
                <th className="px-4 py-3">Delete</th>
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
                const isDeleting = deletingEntryId === entry.id;
                const closestParts = closestPartsFromTotal(draft.resultValue);

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
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#e3edd8] px-3 py-1 text-xs font-black text-[#2f6b3f]">
                        <CheckCircle2 size={14} />
                        Verified
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-[#59655f]">
                      {entry.paidAt}
                    </td>
                    {challenge.type === "HOLE_IN_ONE" ? (
                      <>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <input
                              className="h-10 w-20 rounded-md border border-[#ded6c8] px-3 outline-none focus:border-[#2f6b3f]"
                              min="0"
                              step="1"
                              type="number"
                              value={closestParts.feet}
                              onChange={(event) =>
                                updateClosestResult(
                                  entry.id,
                                  draft,
                                  "feet",
                                  event.target.value,
                                )
                              }
                            />
                            <span className="text-xs font-black uppercase text-[#87908a]">
                              ft
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <input
                              className="h-10 w-20 rounded-md border border-[#ded6c8] px-3 outline-none focus:border-[#2f6b3f]"
                              min="0"
                              step="0.01"
                              type="number"
                              value={closestParts.inches}
                              onChange={(event) =>
                                updateClosestResult(
                                  entry.id,
                                  draft,
                                  "inches",
                                  event.target.value,
                                )
                              }
                            />
                            <span className="text-xs font-black uppercase text-[#87908a]">
                              in
                            </span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <input
                            className="h-10 w-28 rounded-md border border-[#ded6c8] px-3 outline-none focus:border-[#2f6b3f]"
                            min="0"
                            step="0.01"
                            type="number"
                            value={draft.resultValue}
                            onChange={(event) =>
                              updateLongDriveResult(
                                entry.id,
                                draft,
                                event.target.value,
                              )
                            }
                          />
                          <span className="text-xs font-black uppercase text-[#87908a]">
                            yrd
                          </span>
                        </div>
                      </td>
                    )}
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
                            {resultStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <input
                        className="h-10 w-56 rounded-md border border-[#ded6c8] px-3 outline-none focus:border-[#2f6b3f]"
                        placeholder="Result note or evidence"
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
                    <td className="px-4 py-4 align-top">
                      <button
                        aria-label={`Delete ${entry.id}`}
                        className="inline-flex size-10 items-center justify-center rounded-md border border-[#f0c9c1] bg-[#fff5f2] text-[#9a3324] transition hover:bg-[#ffe8e1] disabled:cursor-not-allowed disabled:border-[#ded6c8] disabled:bg-[#f5efdf] disabled:text-[#87908a]"
                        disabled={isDeleting}
                        type="button"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <Trash2 size={16} />
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
