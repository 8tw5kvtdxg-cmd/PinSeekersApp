"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";
import {
  clubhouseChallenges,
  clubhouseChallengeSlugs,
  normalizeChallengeSlug,
} from "@/lib/clubhouse";

type LiveVerificationQueueProps = {
  initialEntries: ClubhouseEntryRecord[];
};

const autoRefreshIntervalMs = 15000;

function challengeName(challengeSlug: string) {
  return (
    clubhouseChallenges.find((challenge) => challenge.slug === challengeSlug)
      ?.name ?? challengeSlug
  );
}

function searchableText(entry: ClubhouseEntryRecord) {
  return [
    entry.id,
    entry.playerName,
    entry.phoneNumber,
    entry.e6DisplayName,
    entry.challengeSlug,
    challengeName(entry.challengeSlug),
    entry.e6EventCode,
    entry.paymentStatus,
    entry.resultStatus,
    entry.entryDecisionStatus,
    entry.playerEmail,
    entry.paidAt,
    entry.validFrom,
    entry.validUntil,
    entry.result,
    entry.evidence,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function resultStatusLabel(status: ClubhouseEntryRecord["resultStatus"]) {
  return status === "Pending E6 Result" ? "Pending Simulator Result" : status;
}

function StatusBadge({ entry }: { entry: ClubhouseEntryRecord }) {
  const statusClass =
    entry.resultStatus === "Rejected"
      ? "bg-[#fff0ec] text-[#9a3324]"
      : entry.resultStatus === "Verified"
      ? "bg-[#e3edd8] text-[#2f6b3f]"
      : entry.resultStatus === "Needs Review"
      ? "bg-[#fff7df] text-[#8a5a00]"
      : "bg-[#eef3ef] text-[#53605a]";

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${statusClass}`}
    >
      <CheckCircle2 size={14} />
      {resultStatusLabel(entry.resultStatus)}
    </span>
  );
}

function DecisionBadge({ entry }: { entry: ClubhouseEntryRecord }) {
  const decisionStatus =
    entry.entryDecisionStatus ?? (entry.adminConfirmedAt ? "Confirmed" : undefined);

  if (!decisionStatus) {
    return (
      <span className="inline-flex w-fit rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-black text-[#53605a]">
        Not decided
      </span>
    );
  }

  const isConfirmed = decisionStatus === "Confirmed";

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
        isConfirmed
          ? "bg-[#e3edd8] text-[#2f6b3f]"
          : "bg-[#fff0ec] text-[#9a3324]"
      }`}
    >
      {isConfirmed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {decisionStatus}
    </span>
  );
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function VerificationEntriesTable({
  entries,
  expandedEntryId,
  onToggleDetails,
  onDecideEntry,
  savingDecision,
}: {
  entries: ClubhouseEntryRecord[];
  expandedEntryId: string;
  onToggleDetails: (entryId: string) => void;
  onDecideEntry: (
    entryId: string,
    decisionStatus: "Confirmed" | "Denied",
  ) => void;
  savingDecision: { entryId: string; decisionStatus: "Confirmed" | "Denied" } | null;
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#ece5d8] bg-[#18211f] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Review entries</h2>
          <p className="mt-1 text-sm font-bold text-white/62">
            {entries.length} matching {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <p className="text-sm font-bold text-white/66">
          Details open inline for faster review.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center">
          <ClipboardCheck className="mx-auto text-[#2f6b3f]" size={34} />
          <h3 className="mt-4 text-xl font-black">No matching entries</h3>
          <p className="mt-3 text-sm leading-6 text-[#59655f]">
            Try a full name, phone number, simulator username, Pin2Win entry ID,
            challenge name, or event code.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
            <thead className="bg-[#fbf8f1] text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
              <tr>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Simulator</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isExpanded = expandedEntryId === entry.id;

                return (
                  <Fragment key={entry.id}>
                    <tr
                      className="border-t border-[#ece5d8] align-top"
                    >
                      <td className="px-4 py-4">
                        <p className="font-black text-[#18211f]">{entry.id}</p>
                        <p className="mt-1 font-bold text-[#59655f]">
                          {challengeName(entry.challengeSlug)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-[#18211f]">
                          {entry.playerName}
                        </p>
                        <p className="mt-1 font-bold text-[#59655f]">
                          {entry.phoneNumber ?? "Not provided"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-[#18211f]">
                          {entry.e6DisplayName}
                        </p>
                        <p className="mt-1 font-bold text-[#59655f]">
                          Code: {entry.e6EventCode}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-[#18211f]">
                          {entry.locationName}
                        </p>
                        <p className="mt-1 font-bold text-[#59655f]">
                          {entry.bayName ?? "Any bay"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-[#18211f]">
                          {entry.paidAt}
                        </p>
                        <p className="mt-1 font-bold text-[#59655f]">
                          {entry.validFrom} - {entry.validUntil}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge entry={entry} />
                      </td>
                      <td className="px-4 py-4">
                        <DecisionBadge entry={entry} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onToggleDetails(entry.id)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-3 text-xs font-black text-[#18211f] transition hover:bg-[#f5efdf]"
                        >
                          <Eye size={15} />
                          {isExpanded ? "Hide details" : "View details"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr className="border-t border-[#ece5d8] bg-[#fbf8f1]">
                        <td colSpan={8} className="px-4 py-5">
                          <div className="grid gap-5 lg:grid-cols-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                                Entry details
                              </p>
                              <p className="mt-2 font-bold text-[#59655f]">
                                Payment: {entry.paymentMethod}
                              </p>
                              <p className="mt-1 font-bold text-[#59655f]">
                                Amount: {formatCurrency(entry.amountCents)}
                              </p>
                              <p className="mt-1 font-bold text-[#59655f]">
                                Booking:{" "}
                                {entry.venueBookingReference ??
                                  entry.bookingVerificationId ??
                                  "Not linked"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                                Review status
                              </p>
                              <p className="mt-2 font-bold text-[#59655f]">
                                Booking check:{" "}
                                {entry.bookingVerificationStatus ?? "Not checked"}
                              </p>
                              <p className="mt-1 font-bold text-[#59655f]">
                                Admin confirmation:{" "}
                                {entry.adminConfirmedAt
                                  ? `${entry.adminConfirmedAt}`
                                  : "Not confirmed"}
                              </p>
                              <p className="mt-1 font-bold text-[#59655f]">
                                Decision email:{" "}
                                {entry.entryDecisionEmailSentAt ??
                                  "Not sent"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                                Result
                              </p>
                              <p className="mt-2 font-black text-[#2f6b3f]">
                                {entry.result ?? "Awaiting simulator result"}
                              </p>
                              <p className="mt-1 font-bold text-[#59655f]">
                                {entry.evidence ?? "No evidence attached yet"}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                disabled={Boolean(savingDecision)}
                                onClick={() => onDecideEntry(entry.id, "Confirmed")}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-3 text-xs font-black text-white transition hover:bg-[#245431] disabled:cursor-not-allowed disabled:bg-[#9aa79f]"
                              >
                                <CheckCircle2 size={15} />
                                {savingDecision?.entryId === entry.id &&
                                savingDecision.decisionStatus === "Confirmed"
                                  ? "Confirming..."
                                  : "Confirm entry"}
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(savingDecision)}
                                onClick={() => onDecideEntry(entry.id, "Denied")}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#f0c1b8] bg-[#fff7f4] px-3 text-xs font-black text-[#9a3324] transition hover:bg-[#ffeae3] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <XCircle size={15} />
                                {savingDecision?.entryId === entry.id &&
                                savingDecision.decisionStatus === "Denied"
                                  ? "Denying..."
                                  : "Deny entry"}
                              </button>
                              <Link
                                href={`/entry/${entry.id}?challenge=${entry.challengeSlug}`}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-3 text-xs font-black text-[#18211f] transition hover:bg-[#f5efdf]"
                              >
                                <Eye size={15} /> Confirmation
                              </Link>
                              <Link
                                href="/admin/results"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-3 text-xs font-black text-[#18211f] transition hover:bg-[#f5efdf]"
                              >
                                <ClipboardCheck size={15} /> Log result
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function LiveVerificationQueue({
  initialEntries,
}: LiveVerificationQueueProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState("");
  const [decisionMessage, setDecisionMessage] = useState("");
  const [savingDecision, setSavingDecision] = useState<{
    entryId: string;
    decisionStatus: "Confirmed" | "Denied";
  } | null>(null);

  const stats = useMemo(
    () => [
      {
        icon: ClipboardCheck,
        label: "Registered entries",
        value: String(entries.length),
      },
      {
        icon: AlertTriangle,
        label: "Pending result",
        value: String(
          entries.filter((entry) => entry.resultStatus === "Pending E6 Result")
            .length,
        ),
      },
      {
        icon: ShieldCheck,
        label: "Verified",
        value: String(
          entries.filter((entry) => entry.resultStatus === "Verified").length,
        ),
      },
    ],
    [entries],
  );

  async function refreshEntries() {
    setIsRefreshing(true);
    setError("");

    try {
      const response = await fetch(`/api/clubhouse/entries?ts=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Could not load verification queue.");
      }

      const data = (await response.json()) as {
        entries?: ClubhouseEntryRecord[];
      };

      setEntries(data.entries ?? []);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load verification queue.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function decideEntry(
    entryId: string,
    decisionStatus: "Confirmed" | "Denied",
  ) {
    setSavingDecision({ entryId, decisionStatus });
    setDecisionMessage("");

    try {
      const response = await fetch(`/api/clubhouse/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: decisionStatus === "Confirmed" ? "confirm-entry" : "deny-entry",
        }),
      });
      const data = (await response.json()) as {
        entry?: ClubhouseEntryRecord;
        error?: string;
      };

      if (data.entry) {
        setEntries((current) =>
          current.map((entry) =>
            entry.id === data.entry?.id ? data.entry : entry,
          ),
        );
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save entry decision.");
      }

      setDecisionMessage(
        `Entry ${entryId} ${decisionStatus.toLowerCase()} and email sent.`,
      );
    } catch (caughtError) {
      setDecisionMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save entry decision.",
      );
    } finally {
      setSavingDecision(null);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(refreshEntries);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        refreshEntries();
      }
    }

    const interval = window.setInterval(refreshEntries, autoRefreshIntervalMs);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshEntries);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshEntries);
    };
  }, []);

  const challengeEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          normalizeChallengeSlug(entry.challengeSlug) ===
          clubhouseChallengeSlugs.holeInOne,
      ),
    [entries],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visibleChallengeEntries = useMemo(
    () =>
      normalizedQuery
        ? challengeEntries.filter((entry) =>
            searchableText(entry).includes(normalizedQuery),
          )
        : challengeEntries,
    [challengeEntries, normalizedQuery],
  );

  return (
    <>
      <div className="mt-8 flex flex-col justify-between gap-3 rounded-lg border border-[#ded6c8] bg-white p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-black text-[#18211f]">
            Live verification monitor
          </p>
          <p className="mt-1 text-sm font-bold text-[#59655f]">
            Auto-refreshing every 15 seconds. Last updated: {lastUpdated}
          </p>
          {error ? (
            <p className="mt-2 text-sm font-bold text-[#9a3324]">{error}</p>
          ) : null}
          {decisionMessage ? (
            <p className="mt-2 text-sm font-bold text-[#2f6b3f]">
              {decisionMessage}
            </p>
          ) : null}
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935] disabled:cursor-not-allowed disabled:bg-[#ded6c8] disabled:text-[#6b756f]"
          disabled={isRefreshing}
          type="button"
          onClick={refreshEntries}
        >
          <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
          Refresh now
        </button>
      </div>

      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-lg border border-[#ded6c8] bg-white p-5"
            >
              <Icon className="text-[#2f6b3f]" size={28} />
              <p className="mt-5 text-3xl font-black">{stat.value}</p>
              <p className="mt-1 text-sm font-bold text-[#59655f]">
                {stat.label}
              </p>
            </div>
          );
        })}
      </section>

      <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-5">
        <label className="grid gap-3">
          <span className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            Search verification queue
          </span>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#87908a]"
                size={20}
              />
              <input
                className="h-12 w-full rounded-md border border-[#ded6c8] bg-[#fbf8f1] pl-12 pr-4 text-base font-bold text-[#18211f] outline-none transition placeholder:text-[#87908a] focus:border-[#2f6b3f] focus:bg-white"
                placeholder="Search full name, phone, simulator username, entry ID, event code..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {query ? (
              <button
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
                type="button"
                onClick={() => setQuery("")}
              >
                Clear
              </button>
            ) : null}
          </div>
        </label>
        <p className="mt-3 text-sm font-bold text-[#59655f]">
          Searches across Full Name, phone number, simulator username, Pin2Win
          Entry ID, challenge, status, result, and event code.
        </p>
      </section>

      <VerificationEntriesTable
        entries={visibleChallengeEntries}
        expandedEntryId={expandedEntryId}
        onToggleDetails={(entryId) =>
          setExpandedEntryId((current) => (current === entryId ? "" : entryId))
        }
        onDecideEntry={decideEntry}
        savingDecision={savingDecision}
      />
    </>
  );
}
