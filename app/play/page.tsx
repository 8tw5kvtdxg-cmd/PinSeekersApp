import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  MapPin,
  MonitorPlay,
  QrCode,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { clubhouseChallengeSlugs } from "@/lib/clubhouse";

const steps = [
  {
    title: "Create your entry",
    description:
      "Use your verified Pin2Win account and enter the player details that match the simulator.",
    icon: ClipboardCheck,
  },
  {
    title: "Complete activation",
    description:
      "Checkout confirms the entry and prepares the simulator event code.",
    icon: BadgeCheck,
  },
  {
    title: "Play in the simulator",
    description:
      "Use the revealed event code inside the simulator software during your session.",
    icon: MonitorPlay,
  },
];

const trustNotes = [
  "Verified email required",
  "One active hole-in-one experience",
  "15-minute attempt window",
  "Result matching by simulator display name",
];

export default async function PlayPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#13201c]">
      <section className="border-b border-[#dfe6df] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 sm:px-10 lg:grid-cols-[0.86fr_1.14fr] lg:px-12">
          <div>
            <Link
              href="/"
              className="text-sm font-black uppercase text-[#2f6b3f]"
            >
              Pin2Win
            </Link>
            <p className="mt-10 inline-flex items-center gap-2 rounded-md bg-[#eaf2ff] px-4 py-2 text-sm font-black text-[#24518a]">
              <QrCode size={16} /> Challenge lobby
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              Start the active Pin2Win experience.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#51615b]">
              Pin2Win gives players a quick path from QR scan to event-code
              access while helping partner venues run a polished simulator
              challenge.
            </p>
          </div>

          <section className="rounded-lg border border-[#dfe6df] bg-[#13201c] p-6 text-white shadow-xl shadow-[#13201c]/12">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase text-[#b7d37c]">
                  Available now
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  Hole-in-One Challenge
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm font-bold text-white/68">
                  <MapPin size={16} /> Alamo Golf Den
                </p>
              </div>
              <Trophy className="text-[#b7d37c]" size={34} />
            </div>

            <p className="mt-5 leading-7 text-white/74">
              A focused golf entertainment activation for partner simulator
              locations, powered by QR registration, checkout, event-code
              access, and result tracking.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {trustNotes.map((note) => (
                <div key={note} className="flex gap-2 rounded-md bg-white/8 p-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-[#b7d37c]" size={17} />
                  <span className="text-sm font-bold text-white/76">{note}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/play/${clubhouseChallengeSlugs.holeInOne}`}
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#b7d37c] px-6 text-sm font-black text-[#13201c] transition hover:bg-[#cbe892]"
            >
              Open QR registration <ArrowRight size={18} />
            </Link>
          </section>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase text-[#2f6b3f]">
            Player flow
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight">
            Fast enough for the bay. Structured enough for the venue.
          </h2>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="rounded-lg border border-[#dfe6df] bg-white p-6 shadow-lg shadow-[#13201c]/5"
              >
                <div className="flex items-center justify-between">
                  <Icon className="text-[#2f6b3f]" size={30} />
                  <span className="text-sm font-black text-[#9aa6a0]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-black">{step.title}</h3>
                <p className="mt-3 leading-7 text-[#51615b]">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
