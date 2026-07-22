import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  ExternalLink,
  MonitorPlay,
  QrCode,
  Trophy,
} from "lucide-react";
import { clubhouseChallengeSlugs } from "@/lib/clubhouse";

const alamoBookingUrl = "https://alamogolfden.golf918.net/embed/y1snhpyhqamwoh5xo4lml";

const challenges = [
  {
    name: "Hole-in-One Challenge",
    location: "Alamo Golf Den",
    description:
      "Book through Alamo Golf Den, confirm your matched booking onsite, and take your shot at the $10,000 prize.",
    href: `/play/${clubhouseChallengeSlugs.holeInOne}`,
    slug: clubhouseChallengeSlugs.holeInOne,
  },
];

const steps = [
  {
    title: "Book with Alamo",
    description: "Choose the premium Pin2Win booking option on Alamo Golf Den's scheduler.",
    icon: ClipboardCheck,
  },
  {
    title: "Scan onsite",
    description: "When you arrive for your simulator time, scan the Pin2Win QR code.",
    icon: QrCode,
  },
  {
    title: "Confirm booking",
    description: "Confirm the matched booking details to unlock the challenge.",
    icon: BadgeCheck,
  },
  {
    title: "Use the E6 code",
    description: "Enter the revealed Event Join Code inside E6 Clubhouse.",
    icon: MonitorPlay,
  },
];

export default async function PlayPage() {
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
              Book. Register. Play.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53605a]">
              Book the premium challenge reservation through Alamo Golf Den.
              When you arrive, scan the Pin2Win QR code and confirm the matched
              booking details to reveal the E6 Event Join Code.
            </p>
            <p className="mt-4 rounded-lg border border-[#ded6c8] bg-white p-4 text-sm font-bold leading-6 text-[#53605a]">
              The active Pin2Win experience is currently the $10,000
              hole-in-one challenge.
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
              <a
                href={alamoBookingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#a8c878] px-5 text-sm font-black text-[#101816] transition hover:bg-[#c1df8d]"
              >
                Book at Alamo Golf Den <ExternalLink size={17} />
              </a>
            </div>
          </div>

          <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Available challenge
            </p>
              <h2 className="mt-2 text-2xl font-black">
                Active challenge
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
                  QR registration <ArrowRight size={17} />
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
