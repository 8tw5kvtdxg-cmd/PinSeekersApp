"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ClubhouseChallenge } from "@/lib/clubhouse";
import { formatEntryFee } from "@/lib/clubhouse";

type EntryFlowProps = {
  challenge: ClubhouseChallenge;
};

export function EntryFlow({ challenge }: EntryFlowProps) {
  const storageKey = `pin2win-entry-draft-${challenge.slug}`;
  const accessSectionRef = useRef<HTMLDivElement>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [eventCode, setEventCode] = useState(challenge.e6JoinCode);
  const [playerName, setPlayerName] = useState("");
  const [e6DisplayName, setE6DisplayName] = useState("");
  const [entryId, setEntryId] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(storageKey);

    if (!savedDraft) {
      return;
    }

    try {
      const draft = JSON.parse(savedDraft) as {
        playerName?: unknown;
        e6DisplayName?: unknown;
      };

      if (typeof draft.playerName === "string") {
        setPlayerName(draft.playerName);
      }

      if (typeof draft.e6DisplayName === "string") {
        setE6DisplayName(draft.e6DisplayName);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  function savePlayerInfo(nextEntryId = entryId) {
    const trimmedPlayerName = playerName.trim();
    const trimmedE6DisplayName = e6DisplayName.trim();

    if (!trimmedPlayerName || !trimmedE6DisplayName) {
      setAccountReady(false);
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        playerName: trimmedPlayerName,
        e6DisplayName: trimmedE6DisplayName,
      }),
    );

    if (nextEntryId) {
      window.localStorage.setItem(
        `pin2win-entry-${nextEntryId}`,
        JSON.stringify({
          challengeSlug: challenge.slug,
          playerName: trimmedPlayerName,
          e6DisplayName: trimmedE6DisplayName,
        }),
      );
    }

    setAccountReady(true);

    return true;
  }

  async function simulatePayment() {
    const wasSaved = savePlayerInfo();

    if (!wasSaved) {
      return;
    }

    setIsCreatingEntry(true);
    setPaymentError("");

    try {
      const response = await fetch("/api/clubhouse/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeSlug: challenge.slug,
          playerName,
          e6DisplayName,
        }),
      });
      const data = (await response.json()) as {
        entry?: {
          id: string;
          challengeSlug: string;
          playerName: string;
          e6DisplayName: string;
          e6EventCode: string;
        };
        error?: string;
      };

      if (!response.ok || !data.entry) {
        throw new Error(data.error ?? "Could not create paid entry.");
      }

      window.localStorage.setItem(
        `pin2win-entry-${data.entry.id}`,
        JSON.stringify({
          challengeSlug: data.entry.challengeSlug,
          playerName: data.entry.playerName,
          e6DisplayName: data.entry.e6DisplayName,
        }),
      );

      setEventCode(data.entry.e6EventCode);
      setEntryId(data.entry.id);
      setPaymentReady(true);
      window.setTimeout(() => {
        accessSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Could not create paid entry.",
      );
    } finally {
      setIsCreatingEntry(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
          QR challenge entry
        </p>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">
          {challenge.name}
        </h1>
        <p className="mt-5 text-lg leading-8 text-[#53605a]">
          Pay through Pin2Win to create a unique eligible entry, then use the E6
          Event Join Code inside the official E6 Clubhouse event.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ["Venue", challenge.venue],
            ["Entry", formatEntryFee(challenge.entryFeeCents)],
            ["Window", `${challenge.playWindowMinutes} min`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                {label}
              </p>
              <p className="mt-1 font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg bg-[#18211f] p-6 text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-[#a8c878]" size={28} />
            <h2 className="text-2xl font-black">Eligibility controls</h2>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-white/76">
            {challenge.eligibilityRules.map((rule) => (
              <li key={rule} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#a8c878]" size={18} />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            Paid entry
          </p>
          <h2 className="mt-2 text-2xl font-black">
            Unlock the E6 event code
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#59655f]">
            This demo shows the intended flow. Live Stripe payment and database
            entry creation can be wired into this same screen.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-lg border border-[#ece5d8] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserRound className="text-[#2f6b3f]" size={24} />
                <div>
                  <h3 className="font-black">1. Player account</h3>
                  <p className="text-sm text-[#59655f]">
                    Match the player to their E6 display name.
                  </p>
                </div>
              </div>
              {accountReady ? (
                <CheckCircle2 className="text-[#2f6b3f]" size={22} />
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                className="h-11 rounded-md border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#2f6b3f]"
                placeholder="Full Name"
                value={playerName}
                suppressHydrationWarning
                onChange={(event) => {
                  setPlayerName(event.target.value);
                  setAccountReady(false);
                  setPaymentReady(false);
                  setEntryId("");
                  setPaymentError("");
                }}
                aria-label="Player name"
              />
              <input
                className="h-11 rounded-md border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#2f6b3f]"
                placeholder="E6 Account Name"
                value={e6DisplayName}
                suppressHydrationWarning
                onChange={(event) => {
                  setE6DisplayName(event.target.value);
                  setAccountReady(false);
                  setPaymentReady(false);
                  setEntryId("");
                  setPaymentError("");
                }}
                aria-label="E6 display name"
              />
            </div>
            {!accountReady && (playerName || e6DisplayName) ? (
              <p className="mt-3 text-sm font-bold text-[#6b756f]">
                Save player info before payment so this entry uses your name.
              </p>
            ) : null}
            <button
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935]"
              type="button"
              onClick={() => savePlayerInfo()}
            >
              Save player info
            </button>
          </div>

          <div className="rounded-lg border border-[#ece5d8] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CreditCard className="text-[#2f6b3f]" size={24} />
                <div>
                  <h3 className="font-black">2. Entry payment</h3>
                  <p className="text-sm text-[#59655f]">
                    Create one eligible attempt for this E6 event.
                  </p>
                </div>
              </div>
              {paymentReady ? (
                <CheckCircle2 className="text-[#2f6b3f]" size={22} />
              ) : null}
            </div>
            <button
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-5 text-sm font-black text-white transition hover:bg-[#3f7f4c] disabled:cursor-not-allowed disabled:bg-[#ded6c8] disabled:text-[#6b756f]"
              disabled={
                isCreatingEntry || !playerName.trim() || !e6DisplayName.trim()
              }
              type="button"
              onClick={simulatePayment}
            >
              {paymentReady ? <CheckCircle2 size={17} /> : <CreditCard size={17} />}
              {isCreatingEntry
                ? "Creating entry..."
                : paymentReady
                ? "Payment simulated"
                : `Simulate ${formatEntryFee(challenge.entryFeeCents)} payment`}
            </button>
            {paymentError ? (
              <p className="mt-3 text-sm font-bold text-[#9a3324]">
                {paymentError}
              </p>
            ) : null}
            {!playerName.trim() || !e6DisplayName.trim() ? (
              <p className="mt-3 text-sm font-bold text-[#6b756f]">
                Enter your name and E6 account name to enable payment.
              </p>
            ) : null}
          </div>

          <div ref={accessSectionRef} className="rounded-lg bg-[#fbf8f1] p-5">
            <div className="flex items-center gap-3">
              {paymentReady ? (
                <KeyRound className="text-[#2f6b3f]" size={26} />
              ) : (
                <LockKeyhole className="text-[#87908a]" size={26} />
              )}
              <h3 className="text-xl font-black">3. E6 access</h3>
            </div>
            <dl className="mt-5 grid gap-4">
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                  Pin2Win Entry ID
                </dt>
                <dd className="mt-1 rounded-md bg-white px-4 py-3 font-black">
                  {paymentReady && entryId ? entryId : "Created after payment"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                  E6 Event Join Code
                </dt>
                <dd className="mt-1 rounded-md bg-white px-4 py-3 font-black">
                  {paymentReady ? eventCode : "Hidden until payment succeeds"}
                </dd>
              </div>
              <div className="flex gap-3 text-sm leading-6 text-[#59655f]">
                <Clock className="mt-0.5 shrink-0 text-[#2f6b3f]" size={18} />
                <span>
                  Valid for one eligible attempt during the assigned{" "}
                  {challenge.playWindowMinutes}-minute play window.
                </span>
              </div>
            </dl>

            {paymentReady ? (
              <Link
                href={`/entry/${entryId}?challenge=${challenge.slug}`}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
              >
                <Eye size={17} /> View confirmation
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
