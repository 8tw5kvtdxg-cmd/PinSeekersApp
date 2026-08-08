"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import type { ClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";

type AdminEntryConfirmationPanelProps = {
  initialEntry: ClubhouseEntryRecord;
};

export function AdminEntryConfirmationPanel({
  initialEntry,
}: AdminEntryConfirmationPanelProps) {
  const [entry, setEntry] = useState(initialEntry);
  const [savingDecision, setSavingDecision] = useState<"" | "Confirmed" | "Denied">("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const decisionStatus =
    entry.entryDecisionStatus ?? (entry.adminConfirmedAt ? "Confirmed" : undefined);

  async function decideEntry(nextDecisionStatus: "Confirmed" | "Denied") {
    setSavingDecision(nextDecisionStatus);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/clubhouse/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:
            nextDecisionStatus === "Confirmed" ? "confirm-entry" : "deny-entry",
        }),
      });
      const data = (await response.json()) as {
        entry?: ClubhouseEntryRecord;
        error?: string;
      };

      if (data.entry) {
        setEntry(data.entry);
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Could not confirm entry.");
      }

      if (!data.entry) {
        throw new Error("Could not confirm entry.");
      }

      setMessage(
        `Entry ${nextDecisionStatus.toLowerCase()} and email sent.`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save entry decision.",
      );
    } finally {
      setSavingDecision("");
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-[#d5cbbd] bg-white p-5 shadow-lg shadow-[#18211f]/6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <ShieldCheck className="mt-1 text-[#2f6b3f]" size={24} />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87908a]">
              Admin confirmation
            </p>
            <h2 className="mt-1 text-xl font-black">
              {decisionStatus
                ? `Entry ${decisionStatus.toLowerCase()}`
                : "Manual decision needed"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#59655f]">
              Confirm or deny this entry after you have verified the player and
              payment details.
            </p>
            {decisionStatus ? (
              <p
                className={`mt-3 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-black ${
                  decisionStatus === "Confirmed"
                    ? "bg-[#eef7e8] text-[#2f6b3f]"
                    : "bg-[#fff0ec] text-[#9a3324]"
                }`}
              >
                {decisionStatus === "Confirmed" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                {decisionStatus} by{" "}
                {entry.entryDecisionBy ?? entry.adminConfirmedBy ?? "Admin"} on{" "}
                {entry.entryDecisionAt ?? entry.adminConfirmedAt}
              </p>
            ) : null}
            {message ? (
              <p className="mt-3 text-sm font-bold text-[#2f6b3f]">{message}</p>
            ) : null}
            {error ? (
              <p className="mt-3 text-sm font-bold text-[#b3261e]">{error}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 sm:min-w-44">
          <button
            type="button"
            onClick={() => decideEntry("Confirmed")}
            disabled={Boolean(savingDecision)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-4 text-sm font-black text-white transition hover:bg-[#245431] disabled:cursor-not-allowed disabled:bg-[#9aa79f]"
          >
            <CheckCircle2 size={17} />
            {savingDecision === "Confirmed" ? "Confirming..." : "Confirm entry"}
          </button>
          <button
            type="button"
            onClick={() => decideEntry("Denied")}
            disabled={Boolean(savingDecision)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#f0c1b8] bg-[#fff7f4] px-4 text-sm font-black text-[#9a3324] transition hover:bg-[#ffeae3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle size={17} />
            {savingDecision === "Denied" ? "Denying..." : "Deny entry"}
          </button>
        </div>
      </div>
    </section>
  );
}
