import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Flag,
  MapPin,
  QrCode,
  Trophy,
  UserPlus,
  WalletCards,
} from "lucide-react";
import { JackpotTicker } from "@/app/components/jackpot-ticker";
import { jackpotSettings } from "@/lib/jackpots";

const challengeTypes = [
  {
    name: "Closest to the Pin",
    detail:
      "Stick it tight, climb the leaderboard, and chase the weekly progressive jackpot.",
    jackpot: jackpotSettings.closestToPin,
  },
  {
    name: "Longest Drive",
    detail: "Post the longest drive of the week and take home the payout.",
    jackpot: jackpotSettings.longestDrive,
  },
];

const steps = [
  "Scan the QR code",
  "Pick your challenge",
  "Create your player profile",
  "Pay $20 to enter",
  "Play your shots",
  "Win cash and climb the board",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] text-[#18211f]">
      <section className="relative isolate min-h-[88vh] overflow-hidden bg-[#101816] text-white">
        <Image
          src="/pinseekers-hero.png"
          alt="Indoor golf simulator bay at a Pin2Win challenge venue"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,18,15,0.92)_0%,rgba(8,18,15,0.74)_42%,rgba(8,18,15,0.22)_100%)]" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col px-6 py-10 sm:px-10 lg:px-12">
          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.55fr)]">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#a8c878] backdrop-blur">
                <Flag size={16} /> Pay. Play. Win.
              </p>
              <h1 className="text-5xl font-black leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">
                Take your shot at $10,000.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
                Scan the QR code at your bay, enter a live golf challenge, and
                compete for real payouts. Closest to the Pin includes weekly
                payouts to the player closest to the pin at the end of the week
                and the hole-in-one jackpot. Longest Drive brings the weekly
                payout.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/play"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-6 text-sm font-black text-white shadow-lg shadow-black/20 transition hover:bg-[#3f7f4c]"
                >
                  Enter a challenge <ArrowRight size={18} />
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/24 px-6 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  View leaderboard
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-white/18 bg-[#0d1513]/78 p-5 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/12 pb-4">
                <div>
                  <p className="text-sm font-bold text-[#a8c878]">
                    Featured Prize
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Closest to the Pin</h2>
                </div>
                <BadgeDollarSign className="text-[#a8c878]" size={36} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-white/8 p-4">
                  <p className="text-sm text-white/60">Entry</p>
                  <p className="mt-1 text-3xl font-black">$20</p>
                </div>
                <div className="rounded-md bg-white/8 p-4">
                  <p className="text-sm text-white/60">Top prize</p>
                  <p className="mt-1 text-3xl font-black">$10K</p>
                </div>
              </div>
              <div className="mt-3 rounded-md bg-[#2f6b3f] p-4 text-white">
                <p className="text-sm font-black uppercase tracking-[0.12em]">
                  Hole-in-one bonus
                </p>
                <p className="mt-1 text-2xl font-black">Chance to win $10,000</p>
              </div>
              <div className="mt-3 grid gap-3">
                <JackpotTicker
                  label={jackpotSettings.closestToPin.label}
                  initialWeeklyRevenue={jackpotSettings.closestToPin.weeklyRevenue}
                  updateDelayMs={jackpotSettings.closestToPin.updateDelayMs}
                  variant="dark"
                />
                <JackpotTicker
                  label={jackpotSettings.longestDrive.label}
                  initialWeeklyRevenue={jackpotSettings.longestDrive.weeklyRevenue}
                  updateDelayMs={jackpotSettings.longestDrive.updateDelayMs}
                  variant="dark"
                />
              </div>
              <ol className="mt-5 space-y-3">
                {steps.slice(0, 4).map((step, index) => (
                  <li key={step} className="flex items-center gap-3 text-sm">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2f6b3f] text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span className="text-white/82">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[0.7fr_1fr] lg:px-12"
      >
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            How it works
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight">
            Scan in, swing big, chase the board.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#53605a]">
            No app hunt. No confusing signup. The QR code at your bay takes you
            straight to the live challenges, the entry fee, and the leaderboard
            everyone in the venue is watching.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step} className="rounded-lg border border-[#ded6c8] bg-white p-5">
              <p className="text-sm font-black text-[#2f6b3f]">
                STEP {index + 1}
              </p>
              <h3 className="mt-3 text-xl font-black">{step}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
                Pick your shot
              </p>
              <h2 className="mt-4 text-4xl font-black">
                Three ways to win.
              </h2>
            </div>
            <Link
              href="/play"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
            >
              Join a challenge <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            <article className="flex min-h-full flex-col rounded-lg border border-[#2f6b3f] bg-[#18211f] p-7 text-white shadow-xl shadow-[#18211f]/16">
              <div className="flex items-start justify-between gap-4">
                <Trophy className="text-[#a8c878]" size={36} />
                <span className="rounded-full bg-[#2f6b3f] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">
                  Featured
                </span>
              </div>
              <h3 className="mt-6 text-4xl font-black">Hole-in-One Prize</h3>
              <p className="mt-4 text-lg leading-8 text-white/74">
                One perfect swing can unlock the headline prize. Take your shot
                at $10,000 while playing the Closest to the Pin challenge.
              </p>
              <div className="mt-10 max-w-md">
                <div className="rounded-lg border border-white/12 bg-[#2f6b3f] px-6 py-5 text-white shadow-lg shadow-black/12">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/78">
                    Featured Prize
                  </p>
                  <p className="mt-3 text-5xl font-black leading-none sm:text-6xl">
                    $10,000
                  </p>
                  <p className="mt-2 text-sm font-bold text-white/72">
                    Hole-in-one payout
                  </p>
                  <div className="mt-5 grid gap-2 border-t border-white/16 pt-4 text-sm font-bold text-white/82 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-white/54">
                        Entry
                      </p>
                      <p className="mt-1">$20</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-white/54">
                        Challenge
                      </p>
                      <p className="mt-1">Closest</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-white/54">
                        Trigger
                      </p>
                      <p className="mt-1">Ace it</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-5">
              {challengeTypes.map((challenge) => (
              <article
                key={challenge.name}
                  className="flex min-h-[278px] flex-col rounded-lg border border-[#e4ddcf] bg-[#fbf8f1] p-6"
              >
                <Trophy className="text-[#2f6b3f]" size={30} />
                <h3 className="mt-5 text-2xl font-black">{challenge.name}</h3>
                <p className="mt-3 leading-7 text-[#59655f]">{challenge.detail}</p>
                <div className="mt-auto pt-5">
                  <JackpotTicker
                    label={challenge.jackpot.label}
                    initialWeeklyRevenue={challenge.jackpot.weeklyRevenue}
                    updateDelayMs={challenge.jackpot.updateDelayMs}
                  />
                </div>
              </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:px-12">
        <div className="rounded-lg bg-[#18211f] p-8 text-white">
          <MapPin className="text-[#a8c878]" size={34} />
          <h2 className="mt-5 text-3xl font-black">Your bay, your challenge.</h2>
          <p className="mt-4 leading-8 text-white/74">
            Scan the code where you are playing and jump into the active
            challenge for that location. Your entry is tied to the right bay,
            contest, and leaderboard.
          </p>
        </div>
        <div className="rounded-lg border border-[#ded6c8] bg-white p-8">
          <QrCode className="text-[#2f6b3f]" size={34} />
          <h2 className="mt-5 text-3xl font-black">Pay $20. Play for more.</h2>
          <p className="mt-4 leading-8 text-[#53605a]">
            Choose the contest, enter your profile, pay the entry, and take
            your swings. Staff records the official result so the leaderboard
            updates cleanly.
          </p>
        </div>
      </section>

      <section className="bg-[#2f6b3f] px-6 py-16 text-white sm:px-10 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em]">
              Pay. Play. Win.
            </p>
            <h2 className="mt-3 text-4xl font-black">
              The next payout could be yours.
            </h2>
          </div>
          <Link
            href="/play"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#17200d] px-6 text-sm font-black text-white transition hover:bg-[#263616]"
          >
            <UserPlus size={18} /> Enter for $20 <WalletCards size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
