"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
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
  "The selected challenge will launch on your bay screen and you can begin the challenge.",
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

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            PinSeekers
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
              Location: San Antonio
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#53605a]">
              Bay: 03
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

        <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
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

          <form className="mt-6 grid gap-4">
            <input name="challenge" type="hidden" value={selectedChallenge} />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
                Player info
              </p>
              <h2 className="mt-2 text-2xl font-black">Who is taking the shot?</h2>
            </div>
            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              Player name
              <input
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                placeholder="Jordan Smith"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              Email
              <input
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                placeholder="jordan@example.com"
                type="email"
              />
            </label>
            <button
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
              type="button"
            >
              <CreditCard size={18} /> Pay $20 and enter
            </button>
            <p className="text-sm leading-6 text-[#6b756f]">
              After payment, keep the confirmation screen open and show it to
              staff before you play.
            </p>
          </form>
        </section>

        <section className="grid gap-4 lg:col-span-2 md:grid-cols-2">
          <Link
            href="/account#login"
            className="rounded-lg border border-[#ded6c8] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#18211f]/10"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <LogIn className="text-[#2f6b3f]" size={30} />
                <h2 className="text-2xl font-black">Login</h2>
              </div>
              <ArrowRight className="text-[#2f6b3f]" size={24} />
            </div>
            <p className="mt-4 leading-7 text-[#59655f]">
              Returning players can use saved account and payment details to
              enter this challenge faster.
            </p>
          </Link>

          <Link
            href="/account#create"
            className="rounded-lg border border-[#2f6b3f] bg-[#18211f] p-6 text-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#18211f]/16"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <UserPlus className="text-[#a8c878]" size={30} />
                <h2 className="text-2xl font-black">Create an account</h2>
              </div>
              <ArrowRight className="text-[#a8c878]" size={24} />
            </div>
            <p className="mt-4 leading-7 text-white/74">
              New players can save shot history, track leaderboard status, and
              unlock repeat-player rewards.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
