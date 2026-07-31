import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  ClipboardCheck,
  MailCheck,
  MonitorPlay,
  QrCode,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { clubhouseChallengeSlugs } from "@/lib/clubhouse";

const playSteps = [
  {
    title: "Scan",
    description: "Players scan the Pin2Win QR code at a partner simulator bay.",
    icon: QrCode,
  },
  {
    title: "Register",
    description: "Pin2Win captures verified account and player details.",
    icon: MailCheck,
  },
  {
    title: "Activate",
    description: "Checkout unlocks the active simulator event code.",
    icon: ClipboardCheck,
  },
  {
    title: "Play",
    description: "The player enters the simulator event and completes the featured experience.",
    icon: MonitorPlay,
  },
];

const platformModules = [
  {
    title: "QR Entry Funnel",
    description:
      "Location-specific QR codes route players into the correct challenge, location, and bay context.",
    icon: QrCode,
  },
  {
    title: "Partner Marketing",
    description:
      "Venues get a promotable golf entertainment offer built for signage, social, email, and repeat visits.",
    icon: Building2,
  },
  {
    title: "Operations Console",
    description:
      "Admins can manage locations, simulator event codes, player entries, revenue by location, and result review.",
    icon: BarChart3,
  },
];

const partnerSignals = [
  "Built for indoor golf simulator venues",
  "Current featured experience: Hole-in-One Challenge",
  "Simulator event-code delivery and result matching",
  "Location-level QR and revenue reporting",
];

const compatibleSystems = ["Simulator Software", "Launch Monitors", "Simulator Bays", "QR Signage"];

export default async function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#13201c]">
      <section className="relative isolate overflow-hidden bg-[#0f1b18] text-white">
        <Image
          src="/pinseekers-hero.png"
          alt="Indoor golf simulator bay for a Pin2Win challenge"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,18,15,0.94)_0%,rgba(8,18,15,0.78)_50%,rgba(8,18,15,0.34)_100%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.6fr)] lg:px-12">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-md border border-white/16 bg-white/10 px-4 py-2 text-sm font-black text-[#b7d37c] backdrop-blur">
              <ShieldCheck size={16} /> Golf entertainment and venue marketing
            </p>
            <h1 className="mt-6 text-5xl font-black leading-none sm:text-6xl lg:text-7xl">
              Turn simulator time into an exciting challenge experience.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
              Pin2Win gives golfers an easy way to scan, register, unlock a
              simulator challenge, and add a little extra excitement to their
              session.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/play"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#b7d37c] px-6 text-sm font-black text-[#0f1b18] shadow-lg shadow-black/20 transition hover:bg-[#cbe892]"
              >
                Start QR registration <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/22 bg-white/8 px-6 text-sm font-black text-white transition hover:bg-white/14"
              >
                Become a partner venue <Building2 size={18} />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/14 bg-[#0c1513]/82 p-5 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex items-center justify-between gap-4 border-b border-white/12 pb-5">
              <div>
                <p className="text-sm font-black text-[#b7d37c]">
                  Active experience
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Hole-in-One Challenge
                </h2>
              </div>
              <Trophy className="text-[#b7d37c]" size={34} />
            </div>

            <div className="mt-5 grid gap-3">
              {[
                ["Entry", "QR + verified account"],
                ["Activation", "Checkout unlocks event code"],
                ["Window", "15-minute attempt window"],
                ["Reporting", "Location-level logs"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[110px_1fr] items-center rounded-md border border-white/10 bg-white/8 px-4 py-3"
                >
                  <p className="text-xs font-black uppercase text-white/52">
                    {label}
                  </p>
                  <p className="font-black">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-md bg-[#b7d37c] p-4 text-[#0f1b18]">
              <p className="text-sm font-black">Built for partners</p>
              <p className="mt-2 text-sm leading-6 font-bold">
                Give players a reason to book, scan, compete, and share the
                experience with friends.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dfe6df] bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-7 sm:px-10 md:grid-cols-[220px_1fr] md:items-center lg:px-12">
          <p className="text-sm font-black uppercase text-[#51615b]">
            Designed around
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            {compatibleSystems.map((system) => (
              <div
                key={system}
                className="rounded-md border border-[#dfe6df] bg-[#f6f8f5] px-4 py-3 text-center text-sm font-black text-[#13201c]"
              >
                {system}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="platform"
        className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase text-[#2f6b3f]">
            Platform
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight">
            A clean operating layer for venue-based golf challenges.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#51615b]">
            Pin2Win connects the pieces a partner needs: onsite QR discovery,
            player identity, payment activation, simulator code delivery, and
            reporting that helps prove demand.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {platformModules.map((module) => {
            const Icon = module.icon;

            return (
              <article
                key={module.title}
                className="rounded-lg border border-[#dfe6df] bg-white p-6 shadow-lg shadow-[#13201c]/5"
              >
                <Icon className="text-[#2f6b3f]" size={30} />
                <h3 className="mt-5 text-2xl font-black">{module.title}</h3>
                <p className="mt-3 leading-7 text-[#51615b]">
                  {module.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#13201c] py-20 text-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-[#b7d37c]">
                How it works
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight">
                Built for a simple onsite flow.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/72">
                The customer journey is quick enough for a simulator session,
                while giving the venue a structured activation to promote.
              </p>
            </div>
            <Link
              href={`/play/${clubhouseChallengeSlugs.holeInOne}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#b7d37c] px-5 text-sm font-black text-[#13201c] transition hover:bg-[#cbe892]"
            >
              Open active challenge <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {playSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  className="rounded-lg border border-white/12 bg-white/8 p-5"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="text-[#b7d37c]" size={28} />
                    <span className="text-sm font-black text-white/42">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-black">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 sm:px-10 lg:grid-cols-[0.88fr_1.12fr] lg:px-12">
        <div>
          <p className="text-sm font-black uppercase text-[#2f6b3f]">
            Partner readiness
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight">
            Make the venue look more active, modern, and shareable.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#51615b]">
            Pin2Win is built to help indoor golf locations package a clear
            entertainment offer that can be explained by signage, promoted
            online, and tracked from the admin portal.
          </p>
          <Link
            href="/contact"
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#13201c] px-6 text-sm font-black text-white transition hover:bg-[#243630]"
          >
            Talk about a venue launch <ArrowRight size={18} />
          </Link>
        </div>

        <div className="rounded-lg border border-[#dfe6df] bg-white p-6 shadow-xl shadow-[#13201c]/8">
          <div className="grid gap-3">
            {partnerSignals.map((signal) => (
              <div
                key={signal}
                className="flex gap-3 rounded-md bg-[#f6f8f5] p-4"
              >
                <BadgeCheck className="mt-0.5 shrink-0 text-[#2f6b3f]" size={20} />
                <p className="font-bold leading-6 text-[#51615b]">{signal}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md bg-[#eaf2ff] p-5">
            <p className="text-sm font-black uppercase text-[#24518a]">
              Current pilot
            </p>
            <h3 className="mt-2 text-2xl font-black">Alamo Golf Den</h3>
            <p className="mt-3 leading-7 text-[#51615b]">
              The platform is set up for partner locations, QR codes, challenge
              entries, simulator event codes, and location-level revenue
              reporting.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
