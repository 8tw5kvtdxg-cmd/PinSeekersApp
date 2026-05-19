"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { clubhouseChallenges } from "@/lib/clubhouse";

type LiveVerificationQueueProps = {
  initialEntries: ClubhouseEntryRecord[];
};

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
    entry.e6DisplayName,
    entry.challengeSlug,
    challengeName(entry.challengeSlug),
    entry.e6EventCode,
    entry.paymentStatus,
    entry.resultStatus,
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

function SearchResults({
  entries,
  query,
}: {
  entries: ClubhouseEntryRecord[];
  query: string;
}) {
  if (!query.trim()) {
    return null;
  }

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
      <div className="border-b border-[#ece5d8] bg-[#fbf8f1] px-5 py-4">
        <p className="text-sm font-black text-[#18211f]">
          Search results for "{query.trim()}"
        </p>
        <p className="mt-1 text-sm font-bold text-[#59655f]">
          {entries.length} matching {entries.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center">
          <Search className="mx-auto text-[#2f6b3f]" size={34} />
          <h2 className="mt-4 text-2xl font-black">No matching entries</h2>
          <p className="mt-3 text-sm leading-6 text-[#59655f]">
            Try a full name, E6 username, Pin2Win entry ID, challenge name, or
            event code.
          </p>
        </div>
      ) : (
        entries.map((entry) => (
          <article
            key={`search-${entry.id}`}
            className="border-t border-[#ece5d8] px-5 py-5"
          >
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <Link
                  href={`/entry/${entry.id}?challenge=${entry.challengeSlug}`}
                  className="text-lg font-black text-[#18211f] transition hover:text-[#2f6b3f]"
                >
                  {entry.playerName} - {entry.id}
                </Link>
                <p className="mt-2 text-sm font-bold text-[#59655f]">
                  E6: {entry.e6DisplayName} · {challengeName(entry.challengeSlug)}
                </p>
                <p className="mt-2 text-sm font-bold text-[#59655f]">
                  Paid: {entry.paidAt} · Window: {entry.validFrom} -{" "}
                  {entry.validUntil}
                </p>
              </div>
              <div className="grid gap-2 text-sm lg:min-w-56">
                <span className="inline-flex w-fit rounded-full bg-[#e3edd8] px-3 py-1 text-xs font-black text-[#2f6b3f]">
                  {entry.resultStatus}
                </span>
                <p className="font-bold text-[#59655f]">
                  Code revealed: {entry.e6EventCode}
                </p>
                <p className="font-bold text-[#59655f]">
                  Result: {entry.result ?? "Awaiting E6 leaderboard result"}
                </p>
              </div>
            </div>
          </article>
        ))
      )}
    </section>
  );
}

function QueueColumn({
  title,
  entries,
}: {
  title: string;
  entries: ClubhouseEntryRecord[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
      <div className="bg-[#18211f] px-5 py-4 text-white">
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-1 text-sm font-bold text-white/62">
          {entries.length} pending paid entries
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center">
          <ClipboardCheck className="mx-auto text-[#2f6b3f]" size={34} />
          <h3 className="mt-4 text-xl font-black">No entries yet</h3>
          <p className="mt-3 text-sm leading-6 text-[#59655f]">
            New paid entries for this challenge will appear here automatically.
          </p>
        </div>
      ) : (
        entries.map((entry, index) => (
          <article
            key={entry.id}
            className="border-t border-[#ece5d8] px-5 py-5"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                  Queue #{index + 1}
                </p>
                <h3 className="mt-2 text-lg font-black">{entry.playerName}</h3>
                <p className="mt-1 text-sm font-bold text-[#59655f]">
                  E6: {entry.e6DisplayName}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e3edd8] px-3 py-1 text-xs font-black text-[#2f6b3f]">
                <CheckCircle2 size={14} />
                {entry.resultStatus}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <p className="font-black">{entry.id}</p>
                <p className="mt-1 font-bold text-[#59655f]">
                  Paid: {entry.paidAt}
                </p>
              </div>
              <div>
                <p className="font-bold text-[#59655f]">
                  Window: {entry.validFrom} - {entry.validUntil}
                </p>
                <p className="mt-1 font-bold text-[#59655f]">
                  Code revealed: {entry.e6EventCode}
                </p>
              </div>
              <div>
                <p className="font-black text-[#2f6b3f]">
                  {entry.result ?? "Awaiting E6 leaderboard result"}
                </p>
                <p className="mt-1 font-bold text-[#59655f]">
                  {challengeName(entry.challengeSlug)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-3 text-xs font-black text-white transition hover:bg-[#3f7f4c]">
                <CheckCircle2 size={15} /> Verify
              </button>
              <Link
                href={`/entry/${entry.id}?challenge=${entry.challengeSlug}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-3 text-xs font-black text-[#18211f] transition hover:bg-[#f5efdf]"
              >
                <Eye size={15} /> Evidence
              </Link>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#f0c1b8] bg-[#fff7f4] px-3 text-xs font-black text-[#9a3324] transition hover:bg-[#ffeae3]">
                <XCircle size={15} /> Reject
              </button>
            </div>
          </article>
        ))
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

  const stats = useMemo(
    () => [
      {
        icon: ClipboardCheck,
        label: "Paid entries",
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

  useEffect(() => {
    refreshEntries();

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        refreshEntries();
      }
    }

    const interval = window.setInterval(refreshEntries, 1000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshEntries);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshEntries);
    };
  }, []);

  const closestToPinEntries = useMemo(
    () =>
      entries.filter((entry) => entry.challengeSlug === "alamo-closest-pin-weekly"),
    [entries],
  );
  const longestDriveEntries = useMemo(
    () =>
      entries.filter((entry) => entry.challengeSlug === "alamo-long-drive-weekly"),
    [entries],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = useMemo(
    () =>
      normalizedQuery
        ? entries.filter((entry) =>
            searchableText(entry).includes(normalizedQuery),
          )
        : [],
    [entries, normalizedQuery],
  );
  const visibleClosestToPinEntries = useMemo(
    () =>
      normalizedQuery
        ? closestToPinEntries.filter((entry) =>
            searchableText(entry).includes(normalizedQuery),
          )
        : closestToPinEntries,
    [closestToPinEntries, normalizedQuery],
  );
  const visibleLongestDriveEntries = useMemo(
    () =>
      normalizedQuery
        ? longestDriveEntries.filter((entry) =>
            searchableText(entry).includes(normalizedQuery),
          )
        : longestDriveEntries,
    [longestDriveEntries, normalizedQuery],
  );

  return (
    <>
      <div className="mt-8 flex flex-col justify-between gap-3 rounded-lg border border-[#ded6c8] bg-white p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-black text-[#18211f]">
            Live verification monitor
          </p>
          <p className="mt-1 text-sm font-bold text-[#59655f]">
            Auto-refreshing every 2.5 seconds. Last updated: {lastUpdated}
          </p>
          {error ? (
            <p className="mt-2 text-sm font-bold text-[#9a3324]">{error}</p>
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
                placeholder="Search full name, E6 username, entry ID, event code..."
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
          Searches across Full Name, E6 username, Pin2Win Entry ID, challenge,
          status, result, and E6 event code.
        </p>
      </section>

      <SearchResults entries={searchResults} query={query} />

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <QueueColumn
          title="Closest to the Pin"
          entries={visibleClosestToPinEntries}
        />
        <QueueColumn
          title="Longest Drive"
          entries={visibleLongestDriveEntries}
        />
      </div>
    </>
  );
}
