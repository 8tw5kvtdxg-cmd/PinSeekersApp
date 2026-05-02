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
  QrCode,
  Settings,
  Trophy,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const shotHistory = [
  {
    id: "PS-1842",
    challenge: "Closest to the Pin",
    location: "San Antonio - Bay 03",
    date: "Apr 29, 2026",
    result: "4 ft 1 in",
    status: "Posted",
  },
  {
    id: "PS-1736",
    challenge: "Longest Drive",
    location: "Austin - Bay 02",
    date: "Apr 22, 2026",
    result: "292 yd",
    status: "Posted",
  },
  {
    id: "PS-1688",
    challenge: "Closest to the Pin",
    location: "Dallas - Bay 01",
    date: "Apr 15, 2026",
    result: "7 ft 8 in",
    status: "Posted",
  },
];

const accountSettings = {
  name: "Jordan Smith",
  email: "jordan@example.com",
  phone: "(210) 555-0148",
  card: "Visa ending in 4242",
  billingZip: "78205",
  lastPayment: "$20.00 on Apr 29, 2026",
};

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
    detail: "Use your account payment method to enter and start your session.",
    icon: CreditCard,
  },
  {
    title: "Track the board",
    detail: "See where your posted shot lands on the weekly leaderboard.",
    icon: Flag,
  },
];

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState<"login" | "create">("create");
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">(
    "dashboard",
  );

  useEffect(() => {
    const syncModeWithHash = () => {
      setMode(window.location.hash === "#login" ? "login" : "create");
    };

    syncModeWithHash();
    window.addEventListener("hashchange", syncModeWithHash);

    return () => window.removeEventListener("hashchange", syncModeWithHash);
  }, []);

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.86fr_1.14fr]">
          <section>
            <Link
              href="/"
              className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
            >
              PinSeekers
            </Link>
            <div className="mt-10 max-w-2xl">
              <UserPlus className="text-[#2f6b3f]" size={36} />
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                Create your player account.
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#53605a]">
                Save your shot history, follow your live challenge rank, and
                keep payment details ready for the next entry. Repeat players
                also unlock rewards program benefits, including faster entry,
                member-only offers, and perks for playing more challenges.
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
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Password
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  placeholder="********"
                  type="password"
                />
              </label>

              {mode === "create" ? (
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Default payment method
                  <input
                    className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                    placeholder="Visa ending in 4242"
                  />
                </label>
              ) : null}

              <button
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
                type="button"
                onClick={() => setIsLoggedIn(true)}
              >
                {mode === "create" ? <UserPlus size={18} /> : <Lock size={18} />}
                {mode === "create" ? "Create account" : "Login"}
                <ArrowRight size={18} />
              </button>
              <p className="text-sm leading-6 text-[#6b756f]">
                This prototype launches the player dashboard immediately after
                signup or login.
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
              PinSeekers
            </Link>
            <h1 className="mt-8 text-4xl font-black sm:text-5xl">
              Player dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53605a]">
              Welcome back, Jordan. Your active challenge, posted shots, and
              saved payment details are ready.
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
                    Closest to the Pin
                  </p>
                  <p className="mt-3 text-5xl font-black">#2</p>
                  <p className="mt-3 text-sm leading-6 text-white/74">
                    Registered at San Antonio - Bay 03. You are 1 ft 5 in behind
                    first place with three days left in the weekly challenge.
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-[#2f6b3f] p-4">
                    <p className="text-sm font-bold text-white/72">Your result</p>
                    <p className="mt-1 text-2xl font-black">4 ft 1 in</p>
                  </div>
                  <div className="rounded-md bg-white/8 p-4">
                    <p className="text-sm font-bold text-white/72">Leader</p>
                    <p className="mt-1 text-2xl font-black">2 ft 8 in</p>
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
                    <h2 className="text-xl font-black">Ready to enter</h2>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#59655f]">
                    Your saved payment method is ready for the next challenge
                    entry.
                  </p>
                  <div className="mt-4 rounded-md bg-[#fbf8f1] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6b756f]">
                      Payment method
                    </p>
                    <p className="mt-1 font-black">{accountSettings.card}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-[#ded6c8] bg-white p-5">
                  <div className="flex items-center gap-3">
                    <Gauge className="text-[#2f6b3f]" size={26} />
                    <h2 className="text-xl font-black">Leaderboard pace</h2>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-[#e3edd8] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
                        To first
                      </p>
                      <p className="mt-1 text-2xl font-black">1 ft 5 in</p>
                    </div>
                    <div className="rounded-md bg-[#fbf8f1] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
                        Time left
                      </p>
                      <p className="mt-1 text-2xl font-black">3 days</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-[#ded6c8] bg-white p-6">
                <div className="flex items-center gap-3">
                  <Activity className="text-[#2f6b3f]" size={28} />
                  <h2 className="text-2xl font-black">Previous shot data</h2>
                </div>
                <div className="mt-5 overflow-hidden rounded-md border border-[#ece5d8]">
                  <div className="grid grid-cols-[1fr_120px] gap-3 bg-[#f2eadb] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#53605a] sm:grid-cols-[1.1fr_1fr_110px_100px]">
                    <span>Challenge</span>
                    <span className="hidden sm:block">Location</span>
                    <span>Result</span>
                    <span className="hidden sm:block">Status</span>
                  </div>
                  {shotHistory.map((shot) => (
                    <div
                      key={shot.id}
                      className="grid grid-cols-[1fr_120px] gap-3 border-t border-[#ece5d8] px-4 py-4 text-sm sm:grid-cols-[1.1fr_1fr_110px_100px]"
                    >
                      <div>
                        <p className="font-black">{shot.challenge}</p>
                        <p className="mt-1 text-xs font-bold text-[#6b756f]">
                          {shot.date}
                        </p>
                      </div>
                      <span className="hidden text-[#53605a] sm:block">
                        {shot.location}
                      </span>
                      <span className="font-black text-[#2f6b3f]">
                        {shot.result}
                      </span>
                      <span className="hidden text-sm font-black text-[#2f6b3f] sm:block">
                        {shot.status}
                      </span>
                    </div>
                  ))}
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
                ["Name", accountSettings.name],
                ["Email", accountSettings.email],
                ["Phone", accountSettings.phone],
                ["Payment method", accountSettings.card],
                ["Billing ZIP", accountSettings.billingZip],
                ["Last payment", accountSettings.lastPayment],
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
                  Payment information shown on the dashboard is sourced from the
                  saved payment method in this account settings tab.
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
