"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  LogIn,
  QrCode,
  Trophy,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const signupSteps = [
  "Choose one of the live challenges at this bay.",
  "Enter your name and email so your score can be posted.",
  "Pay the $20 entry fee to lock in your spot.",
  "Pin2Win reveals the E6 Event Join Code for the official Clubhouse event.",
];

const challenges = [
  {
    name: "Closest to the Pin + Hole-in-One",
    prize: "Chance to win $10,000",
    description:
      "Hit it close to climb the board. Jar it for the hole-in-one prize.",
  },
  {
    name: "Longest Drive",
    prize: "Weekly payout",
    description:
      "Swing away. The longest verified drive of the week gets paid.",
  },
];

export default function PlayPage() {
  const [selectedChallenge, setSelectedChallenge] = useState(challenges[0].name);
  const [accountMode, setAccountMode] = useState<"create" | "login">("create");
  const [isAccountReady, setIsAccountReady] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            Pin2Win
          </Link>
          <h1 className="mt-10 text-4xl font-black sm:text-5xl">
            Enter the challenge
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#53605a]">
            Pick your contest, add your player info, and pay the $20 entry fee.
            Once you are entered, the selected challenge will launch on your bay
            screen and you can begin the challenge. Once you finish your shots,
            the leaderboard will update so you know where you are positioned
            among the other players. May the golf gods be with you. Good luck!
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#53605a]">
              Location: Alamo Golf Den
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#53605a]">
              E6 Clubhouse event
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#53605a]">
              Entry: $20
            </span>
          </div>

          <div className="mt-8 rounded-lg bg-[#18211f] p-6 text-white">
            <div className="flex items-center gap-3">
              <QrCode className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">What to do next</h2>
            </div>
            <ol className="mt-5 space-y-3">
              {signupSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-white/78">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2f6b3f] text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8 lg:mt-14">
          <div className="mb-5">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Select challenge
            </p>
            <h2 className="mt-2 text-2xl font-black">What are you playing?</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {challenges.map((challenge) => {
              const isSelected = selectedChallenge === challenge.name;

              return (
                <button
                  key={challenge.name}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative min-h-44 rounded-md border bg-[#fbf8f1] p-4 text-left transition hover:border-[#2f6b3f] hover:bg-[#f5efdf] focus:outline-none focus:ring-2 focus:ring-[#2f6b3f] focus:ring-offset-2",
                    isSelected
                      ? "border-[#2f6b3f] bg-[#e3edd8] shadow-lg shadow-[#18211f]/12"
                      : "border-[#ded6c8]",
                  )}
                  type="button"
                  onClick={() => setSelectedChallenge(challenge.name)}
                >
                  {isSelected ? (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#18211f] px-3 py-1 text-xs font-black text-white">
                      <CheckCircle2 size={14} /> Selected
                    </span>
                  ) : null}
                  <Trophy
                    className={isSelected ? "text-[#18211f]" : "text-[#2f6b3f]"}
                    size={26}
                  />
                  <span className="mt-4 block pr-24 text-lg font-black">
                    {challenge.name}
                  </span>
                  <span className="mt-2 block text-sm font-black text-[#2f6b3f]">
                    {challenge.prize}
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-[#59655f]">
                    {challenge.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4">
            <input name="challenge" type="hidden" value={selectedChallenge} />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
                Player info
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {isAccountReady
                  ? "Your account is ready."
                  : "Login or create an account to enter."}
              </h2>
            </div>

            {isAccountReady ? (
              <div className="rounded-md bg-[#e3edd8] p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#2f6b3f]" size={26} />
                  <h3 className="text-xl font-black">
                    {selectedChallenge} selected
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#405047]">
                  Your player account is loaded for San Antonio - Bay 03. Finish
                  payment to lock in this entry and launch the session.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm leading-6 text-[#6b756f]">
                  Use your account to save shot history, track leaderboard
                  status, and keep payment details ready for this entry.
                </p>

                <div className="grid grid-cols-2 rounded-md bg-[#f2eadb] p-1">
                  {(["create", "login"] as const).map((option) => (
                    <button
                      key={option}
                      className={cn(
                        "h-11 rounded-md text-sm font-black capitalize transition",
                        accountMode === option
                          ? "bg-[#18211f] text-white shadow-md shadow-[#18211f]/12"
                          : "text-[#53605a] hover:bg-white",
                      )}
                      type="button"
                      onClick={() => setAccountMode(option)}
                    >
                      {option === "create" ? "Create account" : "Login"}
                    </button>
                  ))}
                </div>

                <form className="grid gap-4">
                  {accountMode === "create" ? (
                    <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                      Username
                      <input
                        className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                        placeholder="jordan-smith"
                      />
                    </label>
                  ) : null}

                  <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                    {accountMode === "create" ? "Email" : "Email/Username"}
                    <input
                      className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                      placeholder={
                        accountMode === "create"
                          ? "jordan@example.com"
                          : "jordan@example.com or jordan-smith"
                      }
                      type={accountMode === "create" ? "email" : "text"}
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

                  {accountMode === "create" ? (
                    <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                      Default payment method
                      <input
                        className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                        placeholder="Visa ending in 4242"
                      />
                    </label>
                  ) : null}

                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
                    type="button"
                    onClick={() => setIsAccountReady(true)}
                  >
                    {accountMode === "create" ? (
                      <UserPlus size={18} />
                    ) : (
                      <LogIn size={18} />
                    )}
                    {accountMode === "create"
                      ? "Create account and continue"
                      : "Login and continue"}
                  </button>
                </form>
              </>
            )}

            <button
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-sm font-black transition",
                isAccountReady
                  ? "bg-[#2f6b3f] text-white hover:bg-[#3f7f4c]"
                  : "cursor-not-allowed bg-[#ded6c8] text-[#6b756f]",
              )}
              disabled={!isAccountReady}
              type="button"
            >
              <CreditCard size={18} /> Pay $20 and enter
            </button>
            <Link
              href="/play/alamo-closest-pin-weekly"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#2f6b3f] bg-[#e3edd8] px-6 text-sm font-black text-[#18211f] transition hover:bg-[#d5e8c3]"
            >
              <QrCode size={18} /> Preview E6 code reveal flow
            </Link>
            <p className="text-sm leading-6 text-[#6b756f]">
              After payment, keep the confirmation screen open and use the E6
              Event Join Code inside the official Clubhouse event.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
