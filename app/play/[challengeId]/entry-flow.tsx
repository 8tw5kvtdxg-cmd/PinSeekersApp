"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ClubhouseChallenge } from "@/lib/clubhouse";

const alamoBookingUrl = "https://alamogolfden.golf918.net/embed/y1snhpyhqamwoh5xo4lml";

type EntryFlowProps = {
  challenge: ClubhouseChallenge;
  autoCheckout?: boolean;
  squareReturn?: {
    checkoutId?: string;
    orderId?: string;
    paymentId?: string;
  };
};

type PlayerAccount = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  simulatorDisplayName: string;
};

type EntryDraft = {
  playerName: string;
  phoneNumber: string;
  e6DisplayName: string;
};

type SquareCheckout = {
  id: string;
  amountCents: number;
  paymentFormUrl: string;
  squareOrderId: string;
};

function readEntryDraft(storageKey: string): EntryDraft {
  if (typeof window === "undefined") {
    return { playerName: "", phoneNumber: "", e6DisplayName: "" };
  }

  const savedDraft = window.localStorage.getItem(storageKey);

  if (!savedDraft) {
    return { playerName: "", phoneNumber: "", e6DisplayName: "" };
  }

  try {
    const draft = JSON.parse(savedDraft) as {
      playerName?: unknown;
      phoneNumber?: unknown;
      e6DisplayName?: unknown;
    };

    return {
      playerName: typeof draft.playerName === "string" ? draft.playerName : "",
      phoneNumber:
        typeof draft.phoneNumber === "string" ? draft.phoneNumber : "",
      e6DisplayName:
        typeof draft.e6DisplayName === "string" ? draft.e6DisplayName : "",
    };
  } catch {
    window.localStorage.removeItem(storageKey);

    return { playerName: "", phoneNumber: "", e6DisplayName: "" };
  }
}

function getInitialQrParam(name: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get(name) ?? "";
}

function formatEntryFee(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

export function EntryFlow({
  challenge,
  autoCheckout = false,
  squareReturn,
}: EntryFlowProps) {
  const storageKey = `pin2win-entry-draft-${challenge.slug}`;
  const draft = readEntryDraft(storageKey);
  const accessSectionRef = useRef<HTMLDivElement>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [eventCode, setEventCode] = useState(challenge.e6JoinCode);
  const [locationSlug] = useState(() => getInitialQrParam("location"));
  const [bayName] = useState(() => getInitialQrParam("bay"));
  const [playerName, setPlayerName] = useState(draft.playerName);
  const [phoneNumber, setPhoneNumber] = useState(draft.phoneNumber);
  const [e6DisplayName, setE6DisplayName] = useState(draft.e6DisplayName);
  const [entryId, setEntryId] = useState("");
  const [playerAccount, setPlayerAccount] = useState<PlayerAccount | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isStartingSquareCheckout, setIsStartingSquareCheckout] =
    useState(false);
  const [isCompletingSquareCheckout, setIsCompletingSquareCheckout] =
    useState(Boolean(squareReturn?.checkoutId));
  const autoCheckoutStartedRef = useRef(false);

  useEffect(() => {
    async function loadPlayerAccount() {
      try {
        const response = await fetch("/api/account/me", { cache: "no-store" });
        const data = (await response.json()) as {
          user?: PlayerAccount | null;
        };

        if (response.ok && data.user) {
          setPlayerAccount(data.user);
          setPlayerName((current) => data.user?.name || current || "");
          setPhoneNumber((current) => data.user?.phone || current || "");
          setE6DisplayName(
            (current) =>
              data.user?.simulatorDisplayName ||
              data.user?.username ||
              current ||
              "",
          );
        }
      } catch {
        setPlayerAccount(null);
      } finally {
        setIsLoadingAccount(false);
      }
    }

    void loadPlayerAccount();
  }, []);

  useEffect(() => {
    const checkoutId = squareReturn?.checkoutId?.trim();

    if (!checkoutId) {
      return;
    }

    async function completeReturnedSquareCheckout() {
      setPaymentError("");
      setPaymentNotice("Confirming Square payment...");

      try {
        const response = await fetch("/api/square/checkout/complete", {
          body: JSON.stringify({
            checkoutId,
            squareOrderId: squareReturn?.orderId,
            squarePaymentId: squareReturn?.paymentId,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const data = (await response.json()) as {
          entry?: {
            id: string;
            challengeSlug: string;
            playerName: string;
            phoneNumber?: string;
            e6DisplayName: string;
            e6EventCode: string;
          };
          error?: string;
        };

        if (!response.ok || !data.entry) {
          throw new Error(data.error ?? "Could not confirm Square checkout.");
        }

        revealEntryCode(data.entry);
        setPaymentNotice("Payment confirmed. Your event code is unlocked.");
      } catch (error) {
        setPaymentError(
          error instanceof Error
            ? error.message
            : "Could not confirm Square checkout.",
        );
        setPaymentNotice("");
      } finally {
        setIsCompletingSquareCheckout(false);
      }
    }

    void completeReturnedSquareCheckout();
  }, [squareReturn?.checkoutId, squareReturn?.orderId, squareReturn?.paymentId]);

  useEffect(() => {
    if (
      !autoCheckout ||
      isLoadingAccount ||
      !playerAccount ||
      !playerName.trim() ||
      !phoneNumber.trim() ||
      !e6DisplayName.trim() ||
      isStartingSquareCheckout ||
      autoCheckoutStartedRef.current
    ) {
      return;
    }

    autoCheckoutStartedRef.current = true;
    void startSquareCheckout();
  }, [
    autoCheckout,
    e6DisplayName,
    isLoadingAccount,
    isStartingSquareCheckout,
    phoneNumber,
    playerAccount,
    playerName,
  ]);
  const hasPlayerAccount = Boolean(playerAccount);
  const hasEntryDetails = Boolean(
    playerName.trim() && phoneNumber.trim() && e6DisplayName.trim(),
  );

  async function savePlayerInfo(nextEntryId = entryId) {
    const trimmedPlayerName = playerName.trim();
    const trimmedPhoneNumber = phoneNumber.trim();
    const trimmedE6DisplayName = e6DisplayName.trim();

    if (!trimmedPlayerName || !trimmedPhoneNumber || !trimmedE6DisplayName) {
      setPaymentError(
        "Enter your name, phone number, and simulator account name before continuing.",
      );
      return false;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        playerName: trimmedPlayerName,
        phoneNumber: trimmedPhoneNumber,
        e6DisplayName: trimmedE6DisplayName,
      }),
    );

    if (nextEntryId) {
      window.localStorage.setItem(
        `pin2win-entry-${nextEntryId}`,
        JSON.stringify({
          challengeSlug: challenge.slug,
          playerName: trimmedPlayerName,
          phoneNumber: trimmedPhoneNumber,
          e6DisplayName: trimmedE6DisplayName,
        }),
      );
    }

    if (playerAccount) {
      try {
        const response = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedPlayerName,
            phone: trimmedPhoneNumber,
            simulatorDisplayName: trimmedE6DisplayName,
          }),
        });
        const data = (await response.json()) as {
          user?: PlayerAccount;
          error?: string;
        };

        if (!response.ok || !data.user) {
          throw new Error(data.error ?? "Could not save profile.");
        }

        setPlayerAccount(data.user);
        setPaymentNotice("Player profile saved for faster future entries.");
      } catch (error) {
        setPaymentError(
          error instanceof Error
            ? error.message
            : "Could not save player profile.",
        );

        return false;
      }
    }

    return true;
  }

  function storeEntryDraft(entry: {
    id: string;
    challengeSlug: string;
    playerName: string;
    phoneNumber?: string;
    e6DisplayName: string;
  }) {
    window.localStorage.setItem(
      `pin2win-entry-${entry.id}`,
      JSON.stringify({
        challengeSlug: entry.challengeSlug,
        playerName: entry.playerName,
        phoneNumber: entry.phoneNumber ?? phoneNumber,
        e6DisplayName: entry.e6DisplayName,
      }),
    );
  }

  function revealEntryCode(entry: {
    id: string;
    challengeSlug: string;
    playerName: string;
    phoneNumber?: string;
    e6DisplayName: string;
    e6EventCode: string;
  }) {
    storeEntryDraft(entry);
    setEventCode(entry.e6EventCode);
    setEntryId(entry.id);
    setPaymentReady(true);
    window.setTimeout(() => {
      accessSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  }

  async function startSquareCheckout() {
    const wasSaved = await savePlayerInfo();

    if (!wasSaved) {
      return;
    }

    if (!playerAccount) {
      setPaymentError("Login or create an account before checkout.");
      return;
    }

    setIsStartingSquareCheckout(true);
    setPaymentError("");
    setPaymentNotice("");

    try {
      const response = await fetch("/api/square/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeSlug: challenge.slug,
          playerName,
          phoneNumber,
          e6DisplayName,
          locationSlug,
          bayName,
        }),
      });
      const data = (await response.json()) as {
        checkout?: SquareCheckout;
        error?: string;
      };

      if (!response.ok || !data.checkout) {
        throw new Error(data.error ?? "Could not start Square checkout.");
      }

      const checkout = data.checkout;
      window.location.href = checkout.paymentFormUrl;
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Could not start checkout.",
      );
    } finally {
      setIsStartingSquareCheckout(false);
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
          Enter the Hole-In-One Challenge for {formatEntryFee(challenge.entryFeeCents)}
          while onsite during your reserved simulator bay time. Your saved
          player details are loaded automatically.
        </p>
        <div className="mt-6 max-w-sm">
          <div className="rounded-lg bg-[#18211f] p-4 text-white">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#a8c878]">
              <DollarSign size={17} /> Entry
            </div>
            <p className="mt-2 text-3xl font-black">
              {formatEntryFee(challenge.entryFeeCents)}
            </p>
            <p className="mt-2 text-sm font-bold text-white/72">
              Hole-In-One Challenge entry fee
            </p>
          </div>
        </div>
        <a
          href={alamoBookingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#2f6b3f] transition hover:border-[#2f6b3f]"
        >
          Backup venue booking option <ExternalLink size={17} />
        </a>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ["Venue", challenge.venue],
            ["Challenge", "Hole-in-One"],
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
          Challenge registration
          </p>
          <h2 className="mt-2 text-2xl font-black">
            Unlock the simulator event code
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#59655f]">
            Confirm your player details and complete checkout. Pin2Win will
            then send you to the simulator access page with your entry code.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-lg border border-[#ece5d8] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-[#2f6b3f]" size={24} />
                <div>
                  <h3 className="font-black">1. Player account</h3>
                  <p className="text-sm text-[#59655f]">
                    Login or create an account before checkout.
                  </p>
                </div>
              </div>
              {hasPlayerAccount ? (
                <CheckCircle2 className="text-[#2f6b3f]" size={22} />
              ) : null}
            </div>

            {isLoadingAccount ? (
              <p className="mt-4 text-sm font-bold text-[#6b756f]">
                Checking account status...
              </p>
            ) : playerAccount ? (
              <div className="mt-4 rounded-md bg-[#fbf8f1] p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-black">{playerAccount.username}</p>
                    <p className="mt-1 text-sm text-[#59655f]">
                      {playerAccount.email}
                    </p>
                  </div>
                  <span className="inline-flex h-9 items-center justify-center rounded-md bg-[#eef7e9] px-3 text-xs font-black uppercase tracking-[0.12em] text-[#2f6b3f]">
                    Ready
                  </span>
                </div>
              </div>
            ) : (
              <Link
                href={`/play/${challenge.slug}/account?${new URLSearchParams({
                  ...(locationSlug ? { location: locationSlug } : {}),
                  ...(bayName ? { bay: bayName } : {}),
                }).toString()}`}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935]"
              >
                Login or create account
              </Link>
            )}
          </div>

          <div className="rounded-lg border border-[#ece5d8] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserRound className="text-[#2f6b3f]" size={24} />
                <div>
                  <h3 className="font-black">2. Entry details</h3>
                  <p className="text-sm text-[#59655f]">
                    Match this entry to the player and simulator display name.
                  </p>
                </div>
              </div>
              {hasEntryDetails ? (
                <CheckCircle2 className="text-[#2f6b3f]" size={22} />
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                className="h-11 rounded-md border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#2f6b3f]"
                placeholder="Full Name"
                value={playerName}
                suppressHydrationWarning
                onChange={(event) => {
                  setPlayerName(event.target.value);
                  setPaymentReady(false);
                  setEntryId("");
                  setPaymentError("");
                }}
                aria-label="Player name"
              />
              <input
                className="h-11 rounded-md border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#2f6b3f]"
                inputMode="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                suppressHydrationWarning
                onChange={(event) => {
                  setPhoneNumber(event.target.value);
                  setPaymentReady(false);
                  setEntryId("");
                  setPaymentError("");
                }}
                aria-label="Phone number"
              />
              <input
                className="h-11 rounded-md border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#2f6b3f]"
                placeholder="Simulator Account Name"
                value={e6DisplayName}
                suppressHydrationWarning
                onChange={(event) => {
                  setE6DisplayName(event.target.value);
                  setPaymentReady(false);
                  setEntryId("");
                  setPaymentError("");
                }}
                aria-label="Simulator display name"
              />
            </div>
            {!hasEntryDetails ? (
              <p className="mt-3 text-sm font-bold text-[#6b756f]">
                Complete the missing player details before checkout.
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-[#ece5d8] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CreditCard className="text-[#2f6b3f]" size={24} />
                <div>
                  <h3 className="font-black">3. Secure checkout</h3>
                  <p className="text-sm text-[#59655f]">
                    Pay the challenge entry fee to unlock the event code.
                  </p>
                </div>
              </div>
              {paymentReady ? (
                <CheckCircle2 className="text-[#2f6b3f]" size={22} />
              ) : null}
            </div>
            <div className="mt-4 rounded-md bg-[#fbf8f1] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                Challenge entry
              </p>
              <p className="mt-1 text-2xl font-black">
                {formatEntryFee(challenge.entryFeeCents)}
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#59655f]">
                Payment is handled by Square. You will return to Pin2Win after
                checkout to reveal the event code.
              </p>
            </div>
            <button
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-5 text-sm font-black text-white transition hover:bg-[#3f7f4c] disabled:cursor-not-allowed disabled:bg-[#ded6c8] disabled:text-[#6b756f]"
              disabled={
                isStartingSquareCheckout ||
                isCompletingSquareCheckout ||
                paymentReady
              }
              type="button"
              onClick={startSquareCheckout}
            >
              {paymentReady ? <CheckCircle2 size={17} /> : <CreditCard size={17} />}
              {isCompletingSquareCheckout
                ? "Confirming payment..."
                : isStartingSquareCheckout
                ? "Starting checkout..."
                : paymentReady
                ? "Entry created"
                : "Pay and reveal event code"}
            </button>
            {paymentError ? (
              <p className="mt-3 text-sm font-bold text-[#9a3324]">
                {paymentError}
              </p>
            ) : null}
            {paymentNotice ? (
              <p className="mt-3 text-sm font-bold text-[#2f6b3f]">
                {paymentNotice}
              </p>
            ) : null}
            {!hasPlayerAccount ? (
              <p className="mt-3 text-sm font-bold text-[#6b756f]">
                Login or create an account to continue.
              </p>
            ) : null}
            {hasPlayerAccount && !hasEntryDetails ? (
              <p className="mt-3 text-sm font-bold text-[#6b756f]">
                Enter your name, phone number, and simulator account name to continue.
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
              <h3 className="text-xl font-black">4. Simulator access</h3>
            </div>
            <dl className="mt-5 grid gap-4">
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                  Pin2Win Entry ID
                </dt>
                <dd className="mt-1 rounded-md bg-white px-4 py-3 font-black">
                  {paymentReady && entryId ? entryId : "Created after registration"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                  Simulator Event Code
                </dt>
                <dd className="mt-1 rounded-md bg-white px-4 py-3 font-black">
                  {paymentReady ? eventCode : "Hidden until registration is complete"}
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
