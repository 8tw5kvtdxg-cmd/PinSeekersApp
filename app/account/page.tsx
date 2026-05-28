"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  CreditCard,
  Flag,
  Gauge,
  Lock,
  LogOut,
  QrCode,
  Settings,
  Trophy,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const challengeSteps = [
  {
    title: "Scan at the bay",
    detail: "Use the QR code at your simulator bay to open live challenges.",
    icon: QrCode,
  },
  {
    title: "Pick a challenge",
    detail: "Choose Closest to the Pin or Longest Drive before you enter.",
    icon: Trophy,
  },
  {
    title: "Pay and play",
    detail: "Pay securely at checkout to enter and start your session.",
    icon: CreditCard,
  },
  {
    title: "Track the board",
    detail: "See where your posted shot lands on the monthly leaderboard.",
    icon: Flag,
  },
];

type PlayerAccount = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
};

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState<"login" | "create">("create");
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">(
    "dashboard",
  );
  const [username, setUsername] = useState("");
  const [emailOrLogin, setEmailOrLogin] = useState("");
  const [password, setPassword] = useState("");
  const [playerAccount, setPlayerAccount] = useState<PlayerAccount | null>(null);
  const [accountError, setAccountError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    const syncModeWithHash = () => {
      setMode(window.location.hash === "#login" ? "login" : "create");
    };

    syncModeWithHash();
    window.addEventListener("hashchange", syncModeWithHash);

    return () => window.removeEventListener("hashchange", syncModeWithHash);
  }, []);

  useEffect(() => {
    async function loadPlayerSession() {
      try {
        const response = await fetch("/api/account/me", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          user?: PlayerAccount | null;
        };

        if (response.ok && data.user) {
          setPlayerAccount(data.user);
          setIsLoggedIn(true);
        }
      } catch {
        setPlayerAccount(null);
      } finally {
        setIsLoadingSession(false);
      }
    }

    void loadPlayerSession();
  }, []);

  async function submitAccountForm() {
    const trimmedUsername = username.trim();
    const trimmedEmailOrLogin = emailOrLogin.trim();

    if (
      !trimmedEmailOrLogin ||
      !password.trim() ||
      (mode === "create" && !trimmedUsername)
    ) {
      setAccountError(
        mode === "create"
          ? "Username, email, and password are required."
          : "Email/username and password are required.",
      );
      return;
    }

    setIsSubmitting(true);
    setAccountError("");

    try {
      const response = await fetch(
        mode === "create" ? "/api/account/signup" : "/api/account/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "create"
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
      setIsLoggedIn(true);
    } catch (error) {
      setAccountError(
        error instanceof Error ? error.message : "Could not access account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    setPlayerAccount(null);
    setIsLoggedIn(false);
    setPassword("");
  }

  const playerLabel = playerAccount?.username || playerAccount?.email || "Player";

  if (isLoadingSession) {
    return (
      <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            Pin2Win
          </p>
          <h1 className="mt-8 text-4xl font-black">Loading account...</h1>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.86fr_1.14fr]">
          <section>
            <Link
              href="/"
              className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
            >
              Pin2Win
            </Link>
            <div className="mt-10 max-w-2xl">
              <UserPlus className="text-[#2f6b3f]" size={36} />
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                Create your player account.
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#53605a]">
                Save your shot history, follow your live challenge rank, and
                keep your player details ready for the next entry. Repeat
                players also unlock rewards program benefits, including faster
                entry, member-only offers, and perks for playing more challenges.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {challengeSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.title}
                    className="rounded-lg border border-[#ded6c8] bg-white p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="text-[#2f6b3f]" size={26} />
                      <span className="text-sm font-black text-[#2f6b3f]">
                        STEP {index + 1}
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-black">{step.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#59655f]">
                      {step.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
            <div className="grid grid-cols-2 rounded-md bg-[#f2eadb] p-1">
              {(["create", "login"] as const).map((option) => (
                <button
                  key={option}
                  className={cn(
                    "h-11 rounded-md text-sm font-black capitalize transition",
                    mode === option
                      ? "bg-[#18211f] text-white shadow-md shadow-[#18211f]/12"
                      : "text-[#53605a] hover:bg-white",
                  )}
                  type="button"
                  onClick={() => {
                    window.location.hash = option;
                    setMode(option);
                    setAccountError("");
                  }}
                >
                  {option === "create" ? "Create account" : "Login"}
                </button>
              ))}
            </div>

            <form className="mt-6 grid gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
                  {mode === "create" ? "New player" : "Welcome back"}
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {mode === "create"
                    ? "Set up your account"
                    : "Login to launch your dashboard"}
                </h2>
              </div>

              {mode === "create" ? (
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Username
                  <input
                    className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                    placeholder="jordan-smith"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </label>
              ) : null}

              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                {mode === "create" ? "Email" : "Email/Username"}
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  placeholder={
                    mode === "create" ? "jordan@example.com" : "jordan@example.com or jordan-smith"
                  }
                  type={mode === "create" ? "email" : "text"}
                  value={emailOrLogin}
                  onChange={(event) => setEmailOrLogin(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Password
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  placeholder="********"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              <button
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
                disabled={isSubmitting}
                type="button"
                onClick={submitAccountForm}
              >
                {mode === "create" ? <UserPlus size={18} /> : <Lock size={18} />}
                {isSubmitting
                  ? "Working..."
                  : mode === "create"
                  ? "Create account"
                  : "Login"}
                <ArrowRight size={18} />
              </button>
              {accountError ? (
                <p className="rounded-md bg-[#fff5f2] px-4 py-3 text-sm font-bold text-[#9a3324]">
                  {accountError}
                </p>
              ) : null}
              <p className="text-sm leading-6 text-[#6b756f]">
                Player entries and results appear after a paid challenge entry
                is created and verified.
              </p>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Link
              href="/"
              className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
            >
              Pin2Win
            </Link>
            <h1 className="mt-8 text-4xl font-black sm:text-5xl">
              Player dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53605a]">
              Welcome, {playerLabel}. Your paid entries, verified results, and
              leaderboard status will appear here after you enter a challenge.
            </p>
          </div>
          <div className="grid grid-cols-2 rounded-md bg-[#e8dfcf] p-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: Gauge },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-black transition",
                    activeTab === tab.id
                      ? "bg-[#18211f] text-white"
                      : "text-[#53605a] hover:bg-white",
                  )}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.id as "dashboard" | "settings")
                  }
                >
                  <Icon size={17} /> {tab.label}
                </button>
              );
            })}
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-4 text-sm font-black text-[#53605a] transition hover:bg-[#f5efdf] md:self-end"
            type="button"
            onClick={logout}
          >
            <LogOut size={17} /> Logout
          </button>
        </div>

        {activeTab === "dashboard" ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="grid gap-6">
              <section className="rounded-lg bg-[#18211f] p-6 text-white">
                <div className="flex items-center gap-3">
                  <Trophy className="text-[#a8c878]" size={30} />
                  <h2 className="text-2xl font-black">Current challenge</h2>
                </div>
                <div className="mt-6 rounded-md bg-white/8 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-[#a8c878]">
                    No active entry yet
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/74">
                    Enter a paid challenge to create your player entry. Once a
                    result is verified, your rank and score will appear here.
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-[#2f6b3f] p-4">
                    <p className="text-sm font-bold text-white/72">
                      Verified result
                    </p>
                    <p className="mt-1 text-2xl font-black">Pending</p>
                  </div>
                  <div className="rounded-md bg-white/8 p-4">
                    <p className="text-sm font-bold text-white/72">Rank</p>
                    <p className="mt-1 text-2xl font-black">Pending</p>
                  </div>
                </div>
              </section>

              <Link
                href="/play"
                className="rounded-lg border border-[#2f6b3f] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#18211f]/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <BadgeDollarSign className="text-[#2f6b3f]" size={30} />
                    <h2 className="text-2xl font-black">
                      Enter another Challenge
                    </h2>
                  </div>
                  <ArrowRight className="text-[#2f6b3f]" size={24} />
                </div>
                <p className="mt-4 leading-7 text-[#59655f]">
                  Jump back into Play Now to choose a challenge, pay the entry,
                  and start another scored session.
                </p>
              </Link>
            </div>

            <div className="grid gap-6">
              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[#ded6c8] bg-white p-5">
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-[#2f6b3f]" size={26} />
                    <h2 className="text-xl font-black">Secure checkout</h2>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#59655f]">
                    Payments are handled during each challenge entry through
                    Stripe. No saved payment method is displayed in this
                    dashboard.
                  </p>
                  <Link
                    href="/play"
                    className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935]"
                  >
                    Enter a challenge <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="rounded-lg border border-[#ded6c8] bg-white p-5">
                  <div className="flex items-center gap-3">
                    <Gauge className="text-[#2f6b3f]" size={26} />
                    <h2 className="text-xl font-black">Leaderboard status</h2>
                  </div>
                  <div className="mt-4 rounded-md bg-[#fbf8f1] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6b756f]">
                      Current rank
                    </p>
                    <p className="mt-1 font-black">No verified result yet</p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-[#ded6c8] bg-white p-6">
                <div className="flex items-center gap-3">
                  <Activity className="text-[#2f6b3f]" size={28} />
                  <h2 className="text-2xl font-black">Previous shot data</h2>
                </div>
                <div className="mt-5 overflow-hidden rounded-md border border-[#ece5d8]">
                  <div className="bg-[#f2eadb] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
                    Verified results
                  </div>
                  <div className="px-4 py-8 text-center">
                    <Activity className="mx-auto text-[#2f6b3f]" size={30} />
                    <p className="mt-3 font-black">No shot history yet</p>
                    <p className="mt-2 text-sm leading-6 text-[#59655f]">
                      Your completed challenge results will appear here after
                      they are verified.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <section className="mt-10 rounded-lg border border-[#ded6c8] bg-white p-6">
            <div className="flex items-center gap-3">
              <CreditCard className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">Account settings</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Username", playerAccount?.username ?? ""],
                ["Email", playerAccount?.email ?? ""],
                ["Phone", playerAccount?.phone ?? ""],
              ].map(([label, value]) => (
                <label
                  key={label}
                  className="grid gap-2 text-sm font-bold text-[#53605a]"
                >
                  {label}
                  <input
                    className="h-12 rounded-md border border-[#ded6c8] bg-[#fbf8f1] px-4 text-base font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
                    defaultValue={value}
                  />
                </label>
              ))}
            </div>
            <div className="mt-6 rounded-md bg-[#e3edd8] p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-[#2f6b3f]" size={22} />
                <p className="text-sm leading-6 text-[#405047]">
                  This page is ready for real account data. Payment details are
                  handled through Stripe checkout when a player enters a
                  challenge.
                </p>
              </div>
            </div>
            <button
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-6 text-sm font-black text-white transition hover:bg-[#3f7f4c]"
              type="button"
            >
              <BadgeDollarSign size={18} /> Save account settings
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
