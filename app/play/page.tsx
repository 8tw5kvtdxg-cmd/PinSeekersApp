import Link from "next/link";
import {
  BadgeDollarSign,
  CheckCircle2,
  CreditCard,
  QrCode,
  Trophy,
  UserPlus,
} from "lucide-react";

const signupSteps = [
  "Choose one of the live challenges at this bay.",
  "Enter your name and email so your score can be posted.",
  "Pay the $20 entry fee to lock in your spot.",
  "Show staff your entry, take your shots, and watch the leaderboard.",
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
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
            PinSeekers
          </Link>
          <h1 className="mt-10 text-4xl font-black sm:text-5xl">
            Enter the challenge
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#53605a]">
            Pick your contest, add your player info, and pay the $20 entry fee.
            Once you are entered, staff will help start your simulator round and
            record your official result.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#53605a]">
              Location: Minneapolis
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
              <QrCode className="text-[#c8f03f]" size={28} />
              <h2 className="text-2xl font-black">What to do next</h2>
            </div>
            <ol className="mt-5 space-y-3">
              {signupSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-white/78">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#c8f03f] text-xs font-black text-[#17200d]">
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
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
              Select challenge
            </p>
            <h2 className="mt-2 text-2xl font-black">What are you playing?</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {challenges.map((challenge) => (
              <button
                key={challenge.name}
                className="min-h-44 rounded-md border border-[#ded6c8] bg-[#fbf8f1] p-4 text-left transition hover:border-[#7c8d34] hover:bg-[#f5efdF]"
              >
                <Trophy className="text-[#7c8d34]" size={26} />
                <span className="mt-4 block text-lg font-black">
                  {challenge.name}
                </span>
                <span className="mt-2 block text-sm font-black text-[#7c8d34]">
                  {challenge.prize}
                </span>
                <span className="mt-3 block text-sm leading-6 text-[#59655f]">
                  {challenge.description}
                </span>
              </button>
            ))}
          </div>

          <form className="mt-6 grid gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
                Player info
              </p>
              <h2 className="mt-2 text-2xl font-black">Who is taking the shot?</h2>
            </div>
            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              Player name
              <input
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#7c8d34]"
                placeholder="Jordan Smith"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              Email
              <input
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#7c8d34]"
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

        <section className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-4">
            {signupSteps.map((step, index) => {
              const icons = [CheckCircle2, UserPlus, CreditCard, BadgeDollarSign];
              const Icon = icons[index];

              return (
                <div key={step} className="rounded-lg bg-[#18211f] p-5 text-white">
                  <Icon className="text-[#c8f03f]" size={28} />
                  <p className="mt-4 text-sm font-black text-[#c8f03f]">
                    STEP {index + 1}
                  </p>
                  <p className="mt-2 leading-7 text-white/78">{step}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
