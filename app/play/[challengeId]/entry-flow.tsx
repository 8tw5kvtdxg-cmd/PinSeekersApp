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
  LogIn,
  MailCheck,
  MailWarning,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { MonthlyPrizePot } from "@/app/components/monthly-prize-pot";
import type { ClubhouseChallenge } from "@/lib/clubhouse";
import { formatEntryFee } from "@/lib/clubhouse";
import type { ClubhousePotSummary } from "@/lib/clubhouse-entry-store";

type EntryFlowProps = {
  challenge: ClubhouseChallenge;
  initialPotSummary?: ClubhousePotSummary | null;
};

type PlayerAccount = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  emailVerified: boolean;
};

type EntryDraft = {
  playerName: string;
  phoneNumber: string;
  e6DisplayName: string;
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

export function EntryFlow({ challenge, initialPotSummary }: EntryFlowProps) {
  const storageKey = `pin2win-entry-draft-${challenge.slug}`;
  const draft = readEntryDraft(storageKey);
  const accessSectionRef = useRef<HTMLDivElement>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [eventCode, setEventCode] = useState(challenge.e6JoinCode);
  const [locationSlug] = useState(() => getInitialQrParam("location"));
  const [bayName] = useState(() => getInitialQrParam("bay"));
  const [playerName, setPlayerName] = useState(draft.playerName);
  const [phoneNumber, setPhoneNumber] = useState(draft.phoneNumber);
  const [e6DisplayName, setE6DisplayName] = useState(draft.e6DisplayName);
  const [entryId, setEntryId] = useState("");
  const [playerAccount, setPlayerAccount] = useState<PlayerAccount | null>(null);
  const [accountMode, setAccountMode] = useState<"create" | "login">("create");
  const [username, setUsername] = useState("");
  const [emailOrLogin, setEmailOrLogin] = useState("");
  const [password, setPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [accountNotice, setAccountNotice] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);

  useEffect(() => {
    async function loadPlayerAccount() {
      try {
        const response = await fetch("/api/account/me", { cache: "no-store" });
        const data = (await response.json()) as {
          user?: PlayerAccount | null;
        };

        if (response.ok && data.user) {
          setPlayerAccount(data.user);
          setPlayerName((current) => current || data.user?.name || "");
          setPhoneNumber((current) => current || data.user?.phone || "");
        }
      } catch {
        setPlayerAccount(null);
      } finally {
        setIsLoadingAccount(false);
      }
    }

    void loadPlayerAccount();
  }, []);

  async function submitAccountForm() {
    const trimmedUsername = username.trim();
    const trimmedEmailOrLogin = emailOrLogin.trim();

    if (
      !trimmedEmailOrLogin ||
      !password.trim() ||
      (accountMode === "create" && !trimmedUsername)
    ) {
      setAccountError(
        accountMode === "create"
          ? "Username, email, and password are required."
          : "Email/username and password are required.",
      );
      return;
    }

    setIsSubmittingAccount(true);
    setAccountError("");
    setAccountNotice("");

    try {
      const response = await fetch(
        accountMode === "create" ? "/api/account/signup" : "/api/account/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            accountMode === "create"
              ? {
                  username: trimmedUsername,
                  email: trimmedEmailOrLogin,
                  password,
                }
              : {
                  login: trimmedEmailOrLogin,
                  password,
                },
          ),
        },
      );
      const data = (await response.json()) as {
        user?: PlayerAccount;
        error?: string;
      };

      if (!response.ok || !data.user) {
        throw new Error(data.error ?? "Could not access account.");
      }

      setPlayerAccount(data.user);
      setPlayerName((current) => current || data.user?.name || "");
      setPhoneNumber((current) => current || data.user?.phone || "");
      setPassword("");
      setAccountNotice(
        accountMode === "create"
          ? "Account created. Check your email to verify before payment."
          : data.user.emailVerified
          ? "Logged in. You can continue this entry."
          : "Logged in. Verify your email before payment.",
      );
    } catch (error) {
      setAccountError(
        error instanceof Error ? error.message : "Could not access account.",
      );
    } finally {
      setIsSubmittingAccount(false);
    }
  }

  async function resendVerification() {
    setIsResendingVerification(true);
    setAccountError("");
    setAccountNotice("");

    try {
      const response = await fetch("/api/account/resend-verification", {
        method: "POST",
      });
      const data = (await response.json()) as {
        alreadyVerified?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Verification email could not be sent.");
      }

      setAccountNotice(
        data.alreadyVerified
          ? "Email is already verified."
          : "Verification email sent. Check your inbox.",
      );
    } catch (error) {
      setAccountError(
        error instanceof Error
          ? error.message
          : "Verification email could not be sent.",
      );
    } finally {
      setIsResendingVerification(false);
    }
  }

  const isVerifiedPlayer = Boolean(playerAccount?.emailVerified);
  const hasEntryDetails = Boolean(
    playerName.trim() && phoneNumber.trim() && e6DisplayName.trim(),
  );
  const canStartPayment = isVerifiedPlayer && hasEntryDetails;

  function savePlayerInfo(nextEntryId = entryId) {
    const trimmedPlayerName = playerName.trim();
    const trimmedPhoneNumber = phoneNumber.trim();
    const trimmedE6DisplayName = e6DisplayName.trim();

    if (!trimmedPlayerName || !trimmedPhoneNumber || !trimmedE6DisplayName) {
      setAccountReady(false);
      return;
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

    setAccountReady(true);

    return true;
  }

  async function simulatePayment() {
    const wasSaved = savePlayerInfo();

    if (!wasSaved) {
      return;
    }

    if (!isVerifiedPlayer) {
      setPaymentError("Verify your email before creating a paid entry.");
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
          phoneNumber,
          e6DisplayName,
          locationSlug,
          bayName,
        }),
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
        throw new Error(data.error ?? "Could not create paid entry.");
      }

      window.localStorage.setItem(
        `pin2win-entry-${data.entry.id}`,
        JSON.stringify({
          challengeSlug: data.entry.challengeSlug,
          playerName: data.entry.playerName,
          phoneNumber: data.entry.phoneNumber ?? phoneNumber,
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

  async function startStripeCheckout() {
    const wasSaved = savePlayerInfo();

    if (!wasSaved) {
      return;
    }

    if (!playerAccount) {
      setPaymentError("Create or login to your account before payment.");
      return;
    }

    if (!playerAccount.emailVerified) {
      setPaymentError("Verify your email before payment.");
      return;
    }

    setIsStartingCheckout(true);
    setPaymentError("");

    try {
      const response = await fetch("/api/clubhouse/checkout", {
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
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "Could not start Stripe Checkout.");
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Could not start Stripe Checkout.",
      );
      setIsStartingCheckout(false);
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
        <div className="mt-6 max-w-md">
          <MonthlyPrizePot
            challengeSlug={challenge.slug}
            initialSummary={initialPotSummary}
          />
        </div>
        {locationSlug ? (
          <div className="mt-4 rounded-lg border border-[#ded6c8] bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
              Scanned location
            </p>
            <p className="mt-1 font-black">
              {locationSlug.replaceAll("-", " ")}
              {bayName ? ` - ${bayName}` : ""}
            </p>
          </div>
        ) : null}

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
            Checkout is handled securely by Stripe. After payment, your
            confirmation page will show your Pin2Win entry ID and the E6 Event
            Join Code.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-lg border border-[#ece5d8] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {isVerifiedPlayer ? (
                  <MailCheck className="text-[#2f6b3f]" size={24} />
                ) : (
                  <MailWarning className="text-[#8a6419]" size={24} />
                )}
                <div>
                  <h3 className="font-black">1. Player account</h3>
                  <p className="text-sm text-[#59655f]">
                    Login or create an account and verify your email.
                  </p>
                </div>
              </div>
              {isVerifiedPlayer ? (
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
                  {playerAccount.emailVerified ? (
                    <span className="inline-flex h-9 items-center justify-center rounded-md bg-[#eef7e9] px-3 text-xs font-black uppercase tracking-[0.12em] text-[#2f6b3f]">
                      Verified
                    </span>
                  ) : (
                    <button
                      className="inline-flex h-10 items-center justify-center rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935]"
                      disabled={isResendingVerification}
                      type="button"
                      onClick={resendVerification}
                    >
                      {isResendingVerification ? "Sending..." : "Resend email"}
                    </button>
                  )}
                </div>
                {!playerAccount.emailVerified ? (
                  <p className="mt-3 text-sm font-bold text-[#8a6419]">
                    Check your inbox and verify your email before payment.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4">
                <div className="grid grid-cols-2 rounded-md bg-[#f2eadb] p-1">
                  {(["create", "login"] as const).map((option) => (
                    <button
                      key={option}
                      className={`h-10 rounded-md text-sm font-black capitalize transition ${
                        accountMode === option
                          ? "bg-[#18211f] text-white"
                          : "text-[#53605a] hover:bg-white"
                      }`}
                      type="button"
                      onClick={() => {
                        setAccountMode(option);
                        setAccountError("");
                        setAccountNotice("");
                      }}
                    >
                      {option === "create" ? "Create account" : "Login"}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-3">
                  {accountMode === "create" ? (
                    <input
                      className="h-11 rounded-md border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#2f6b3f]"
                      placeholder="Username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      aria-label="Username"
                    />
                  ) : null}
                  <input
                    className="h-11 rounded-md border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#2f6b3f]"
                    placeholder={
                      accountMode === "create"
                        ? "Email"
                        : "Email or username"
                    }
                    type={accountMode === "create" ? "email" : "text"}
                    value={emailOrLogin}
                    onChange={(event) => setEmailOrLogin(event.target.value)}
                    aria-label={
                      accountMode === "create" ? "Email" : "Email or username"
                    }
                  />
                  <input
                    className="h-11 rounded-md border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#2f6b3f]"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-label="Password"
                  />
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935]"
                    disabled={isSubmittingAccount}
                    type="button"
                    onClick={submitAccountForm}
                  >
                    {accountMode === "create" ? (
                      <UserPlus size={17} />
                    ) : (
                      <LogIn size={17} />
                    )}
                    {isSubmittingAccount
                      ? "Working..."
                      : accountMode === "create"
                      ? "Create and send email"
                      : "Login"}
                  </button>
                </div>
              </div>
            )}

            {accountError ? (
              <p className="mt-3 rounded-md bg-[#fff5f2] px-3 py-2 text-sm font-bold text-[#9a3324]">
                {accountError}
              </p>
            ) : null}
            {accountNotice ? (
              <p className="mt-3 rounded-md bg-[#eef7e9] px-3 py-2 text-sm font-bold text-[#2f6b3f]">
                {accountNotice}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-[#ece5d8] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserRound className="text-[#2f6b3f]" size={24} />
                <div>
                  <h3 className="font-black">2. Entry details</h3>
                  <p className="text-sm text-[#59655f]">
                    Match this entry to the player and E6 display name.
                  </p>
                </div>
              </div>
              {accountReady ? (
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
                  setAccountReady(false);
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
                  setAccountReady(false);
                  setPaymentReady(false);
                  setEntryId("");
                  setPaymentError("");
                }}
                aria-label="Phone number"
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
            {!accountReady && (playerName || phoneNumber || e6DisplayName) ? (
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
                  <h3 className="font-black">3. Entry payment</h3>
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
                isStartingCheckout ||
                isCreatingEntry ||
                !canStartPayment
              }
              type="button"
              onClick={startStripeCheckout}
            >
              <CreditCard size={17} />
              {isStartingCheckout
                ? "Opening Stripe..."
                : `Pay ${formatEntryFee(challenge.entryFeeCents)} with Stripe`}
            </button>
            <button
              className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-4 text-xs font-black text-[#53605a] transition hover:bg-[#f5efdf] disabled:cursor-not-allowed disabled:bg-[#f5efdf] disabled:text-[#87908a]"
              disabled={
                isStartingCheckout ||
                isCreatingEntry ||
                !canStartPayment
              }
              type="button"
              onClick={simulatePayment}
            >
              {paymentReady ? <CheckCircle2 size={15} /> : <CreditCard size={15} />}
              {isCreatingEntry
                ? "Creating test entry..."
                : paymentReady
                ? "Test entry created"
                : "Testing only: simulate payment"}
            </button>
            {paymentError ? (
              <p className="mt-3 text-sm font-bold text-[#9a3324]">
                {paymentError}
              </p>
            ) : null}
            {!isVerifiedPlayer ? (
              <p className="mt-3 text-sm font-bold text-[#6b756f]">
                Login and verify your email to enable payment.
              </p>
            ) : null}
            {isVerifiedPlayer && !hasEntryDetails ? (
              <p className="mt-3 text-sm font-bold text-[#6b756f]">
                Enter your name, phone number, and E6 account name to enable payment.
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
              <h3 className="text-xl font-black">4. E6 access</h3>
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
