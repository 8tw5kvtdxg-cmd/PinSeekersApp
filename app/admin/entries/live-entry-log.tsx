"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ClubhouseEntryRecord } from "@/lib/clubhouse-entry-store";
import { clubhouseChallenges, normalizeChallengeSlug } from "@/lib/clubhouse";

type LiveEntryLogProps = {
  initialEntries: ClubhouseEntryRecord[];
  challengeFilter?: string;
};

const autoRefreshIntervalMs = 15000;

function challengeName(challengeSlug: string) {
  return (
    clubhouseChallenges.find((challenge) => challenge.slug === challengeSlug)
      ?.name ?? challengeSlug
  );
}

function resultStatusLabel(status: ClubhouseEntryRecord["resultStatus"]) {
  return status === "Pending E6 Result" ? "Pending Simulator Result" : status;
}

export function LiveEntryLog({
  initialEntries,
  challengeFilter,
}: LiveEntryLogProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refundingEntryId, setRefundingEntryId] = useState("");
  const [refundErrorByEntryId, setRefundErrorByEntryId] = useState<Record<string, string>>({});

  async function issueClosureRefund(entry: ClubhouseEntryRecord) {
    const confirmed = window.confirm(
      entry.refundStatus === "PENDING"
        ? `Check the current Square refund status for ${entry.playerName}?`
        : `Refund $${(entry.amountCents / 100).toFixed(2)} to the original Square payment for ${entry.playerName}? This financial action cannot be reversed in Pin2Win.`,
    );

    if (!confirmed) return;

    setRefundingEntryId(entry.id);
    setRefundErrorByEntryId((current) => ({ ...current, [entry.id]: "" }));

    try {
      const response = await fetch(`/api/admin/refunds/${entry.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          reason:
            entry.closureRefundReason ||
            "Challenge closed before the paid attempt could be completed.",
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Square refund could not be issued.");
      }

      await refreshEntries();
    } catch (caughtError) {
      setRefundErrorByEntryId((current) => ({
        ...current,
        [entry.id]:
          caughtError instanceof Error
            ? caughtError.message
            : "Square refund could not be issued.",
      }));
    } finally {
      setRefundingEntryId("");
    }
  }

  async function refreshEntries() {
    setIsRefreshing(true);
    setError("");

    try {
      const response = await fetch("/api/clubhouse/entries", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load entries.");
      }

      const data = (await response.json()) as {
        entries?: ClubhouseEntryRecord[];
      };

      setEntries(data.entries ?? []);
      setLastUpdated(new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load entries.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const interval = window.setInterval(refreshEntries, autoRefreshIntervalMs);

    return () => window.clearInterval(interval);
  }, []);

  const visibleEntries = useMemo(
    () =>
      challengeFilter
        ? entries.filter(
            (entry) =>
              normalizeChallengeSlug(entry.challengeSlug) ===
              normalizeChallengeSlug(challengeFilter),
          )
        : entries,
    [challengeFilter, entries],
  );

  return (
    <>
      <div className="mt-8 flex flex-col justify-between gap-3 rounded-lg border border-[#ded6c8] bg-white p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-black text-[#18211f]">
            Live entry monitor
          </p>
          <p className="mt-1 text-sm font-bold text-[#59655f]">
            Auto-refreshing every 15 seconds. Last updated: {lastUpdated}
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

      <section className="mt-6 grid gap-5 md:grid-cols-5">
        {[
          {
            icon: CreditCard,
            label: "Registered entries",
            value: String(visibleEntries.length),
          },
          {
            icon: Clock,
            label: "Pending result",
            value: String(
              visibleEntries.filter(
                (entry) => entry.resultStatus === "Pending E6 Result",
              ).length,
            ),
          },
          {
            icon: ShieldCheck,
            label: "Needs review",
            value: String(
              visibleEntries.filter(
                (entry) => entry.resultStatus === "Needs Review",
              ).length,
            ),
          },
          {
            icon: CheckCircle2,
            label: "Verified",
            value: String(
              visibleEntries.filter((entry) => entry.resultStatus === "Verified")
                .length,
            ),
          },
          {
            icon: RotateCcw,
            label: "Refund review",
            value: String(
              visibleEntries.filter(
                (entry) =>
                  entry.closureRefundEligibleAt &&
                  entry.paymentStatus !== "Refunded",
              ).length,
            ),
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-lg border border-[#ded6c8] bg-white p-5"
            >
              <Icon className="text-[#2f6b3f]" size={26} />
              <p className="mt-4 text-3xl font-black">{stat.value}</p>
              <p className="mt-1 text-sm font-bold text-[#59655f]">
                {stat.label}
              </p>
            </div>
          );
        })}
      </section>

      <section className="mt-10 overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
        <div className="grid gap-3 bg-[#18211f] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-white/68 lg:grid-cols-[1.15fr_1fr_1fr_1fr_150px]">
          <span>Entry</span>
          <span>Player</span>
          <span>Challenge</span>
          <span>Window</span>
          <span>Status</span>
        </div>

        {visibleEntries.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="mx-auto text-[#2f6b3f]" size={34} />
            <h2 className="mt-4 text-2xl font-black">No registered entries yet</h2>
            <p className="mt-3 text-sm leading-6 text-[#59655f]">
              Scan the QR code after booking through the venue to create the
              first registered entry record.
            </p>
          </div>
        ) : (
          visibleEntries.map((entry) => (
            <article
              key={entry.id}
              className="grid gap-5 border-t border-[#ece5d8] px-5 py-5 lg:grid-cols-[1.15fr_1fr_1fr_1fr_150px]"
            >
              <div>
                <p className="font-black">{entry.id}</p>
                <p className="mt-1 text-sm font-bold text-[#59655f]">
                  Paid: {entry.paidAt}
                </p>
                <Link
                  href={`/entry/${entry.id}?challenge=${entry.challengeSlug}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#2f6b3f]"
                >
                  <ExternalLink size={15} /> Confirmation
                </Link>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <UserRound className="text-[#2f6b3f]" size={18} />
                  <p className="font-black">{entry.playerName}</p>
                </div>
                <p className="mt-1 text-sm font-bold text-[#59655f]">
                  Phone: {entry.phoneNumber ?? "Not provided"}
                </p>
                <p className="mt-1 text-sm font-bold text-[#59655f]">
                  Simulator: {entry.e6DisplayName}
                </p>
              </div>
              <div>
                <p className="font-black">{challengeName(entry.challengeSlug)}</p>
                <p className="mt-1 text-sm font-bold text-[#59655f]">
                  Code revealed: {entry.e6EventCode}
                </p>
              </div>
              <div>
                <p className="font-bold">{entry.validFrom}</p>
                <p className="mt-1 text-sm font-bold text-[#59655f]">
                  to {entry.validUntil}
                </p>
              </div>
              <div>
                <span className="inline-flex rounded-full bg-[#e3edd8] px-3 py-1 text-xs font-black text-[#2f6b3f]">
                  {resultStatusLabel(entry.resultStatus)}
                </span>
                <p className="mt-3 text-sm font-bold text-[#59655f]">
                  Payment: {entry.paymentMethod ?? "Venue booking"} — {entry.paymentStatus}
                </p>
                {entry.refundStatus ? (
                  <p className="mt-1 text-xs font-black text-[#79500e]">
                    Square refund: {entry.refundStatus}
                    {entry.squareRefundId ? ` (${entry.squareRefundId})` : ""}
                  </p>
                ) : null}
                {entry.closureRefundEligibleAt && entry.paymentMethod === "Square" && entry.paymentStatus !== "Refunded" ? (
                  <button
                    className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#8d2f1f] px-3 text-xs font-black text-white disabled:opacity-50"
                    disabled={refundingEntryId === entry.id}
                    type="button"
                    onClick={() => issueClosureRefund(entry)}
                  >
                    <RotateCcw size={14} />
                    {refundingEntryId === entry.id
                      ? "Sending to Square..."
                      : entry.refundStatus === "PENDING"
                        ? "Check refund status"
                        : entry.refundStatus === "FAILED"
                        ? "Retry Square refund"
                        : `Refund $${(entry.amountCents / 100).toFixed(2)}`}
                  </button>
                ) : null}
                {refundErrorByEntryId[entry.id] ? (
                  <p className="mt-2 text-xs font-bold text-[#9a3324]">
                    {refundErrorByEntryId[entry.id]}
                  </p>
                ) : null}
                {entry.bookingVerificationId ? (
                  <p className="mt-1 text-xs font-black text-[#2f6b3f]">
                    Match: {entry.bookingVerificationId}
                  </p>
                ) : null}
                {entry.bookingVerificationStatus ? (
                  <p className="mt-1 text-xs font-bold text-[#59655f]">
                    {entry.bookingVerificationStatus}
                  </p>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
