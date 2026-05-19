import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  MonitorPlay,
  QrCode,
  Trophy,
} from "lucide-react";

const challenges = [
  {
    name: "Closest to the Pin",
    location: "Alamo Golf Den",
    description:
      "Aim for the flag, post your shot in E6, and see where you land on the board.",
    href: "/play/alamo-closest-pin-weekly",
  },
  {
    name: "Longest Drive",
    location: "Alamo Golf Den",
    description:
      "Take your biggest swing and compete for the longest verified drive.",
    href: "/play/alamo-long-drive-weekly",
  },
];

const steps = [
  {
    title: "Choose a challenge",
    description: "Select the event you want to enter at the simulator bay.",
    icon: Trophy,
  },
  {
    title: "Add player details",
    description: "Enter your full name and E6 account name before checkout.",
    icon: BadgeCheck,
  },
  {
    title: "Pay the entry fee",
    description: "Your confirmation page shows your Pin2Win entry ID.",
    icon: CreditCard,
  },
  {
    title: "Use the E6 code",
    description: "Enter the revealed Event Join Code inside E6 Clubhouse.",
    icon: MonitorPlay,
  },
];

export default function PlayPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          Pin2Win
        </Link>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Play now
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Pick the challenge running at your bay.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53605a]">
              Choose the event you want to play, enter your player information,
              and complete payment. Your confirmation page will show the E6
              Event Join Code you need for the challenge.
            </p>
            <div className="mt-8 rounded-lg bg-[#18211f] p-6 text-white">
              <div className="flex items-center gap-3">
                <QrCode className="text-[#a8c878]" size={28} />
                <h2 className="text-2xl font-black">QR entry flow</h2>
              </div>
              <ol className="mt-5 space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2f6b3f] text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="text-[#a8c878]" size={16} />
                          <p className="font-black">{step.title}</p>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-white/72">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Available challenges
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Alamo Golf Den pilot events
            </h2>
            <div className="mt-6 grid gap-4">
              {challenges.map((challenge) => (
                <article
                  key={challenge.name}
                  className="rounded-lg border border-[#ded6c8] bg-[#fbf8f1] p-5"
                >
                  <Trophy className="text-[#2f6b3f]" size={28} />
                  <h3 className="mt-4 text-2xl font-black">{challenge.name}</h3>
                  <p className="mt-1 text-sm font-black text-[#2f6b3f]">
                    {challenge.location}
                  </p>
                  <p className="mt-3 leading-7 text-[#59655f]">
                    {challenge.description}
                  </p>
                  <Link
                    href={challenge.href}
                    className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
                  >
                  Enter challenge <ArrowRight size={17} />
                </Link>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
