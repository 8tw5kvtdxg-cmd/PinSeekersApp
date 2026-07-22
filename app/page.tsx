import Image from "next/image";
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

const playerSteps = [
  {
    title: "Book",
    description: "Reserve the premium Pin2Win time through Alamo Golf Den.",
    icon: ClipboardCheck,
  },
  {
    title: "Arrive",
    description: "Use your simulator reservation and locate the Pin2Win QR code.",
    icon: QrCode,
  },
  {
    title: "Unlock",
    description: "Confirm the matched booking details to reveal the E6 code.",
    icon: MonitorPlay,
  },
  {
    title: "Swing",
    description: "Enter the E6 event and take your shot at the hole-in-one prize.",
    icon: Trophy,
  },
];

const challengeTypes = [
  {
    name: "Hole-in-One Challenge",
    description:
      "Book the premium Alamo reservation, confirm your booking onsite, and take your shot at the $10,000 prize.",
    href: `/play/${clubhouseChallengeSlugs.holeInOne}`,
    slug: clubhouseChallengeSlugs.holeInOne,
    featuredPrize: "$10,000 ace prize",
  },
];

const playerBenefits = [
  "Premium challenge reservations are booked through Alamo Golf Den.",
  "Verified entrants are eligible for the $10,000 hole-in-one prize.",
  "Use your E6 username so your result can be matched correctly.",
];

export default async function Home() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] text-[#18211f]">
      <section className="relative isolate min-h-[84vh] overflow-hidden bg-[#101816] text-white">
        <Image
          src="/pinseekers-hero.png"
          alt="Indoor golf simulator bay for a Pin2Win challenge"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,18,15,0.92)_0%,rgba(8,18,15,0.74)_48%,rgba(8,18,15,0.25)_100%)]" />

        <div className="relative mx-auto flex min-h-[84vh] max-w-7xl flex-col px-6 py-10 sm:px-10 lg:px-12">
          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.55fr)]">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#a8c878] backdrop-blur">
                <QrCode size={16} /> Book. Register. Play.
              </p>
              <h1 className="text-5xl font-black leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">
                Take one swing at a $10,000 hole-in-one.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
                Book a premium challenge reservation through Alamo Golf Den,
                arrive for your simulator time, scan the Pin2Win QR code, and
                confirm your matched booking to reveal the E6 Event Join Code.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href={alamoBookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#a8c878] px-6 text-sm font-black text-[#101816] shadow-lg shadow-black/20 transition hover:bg-[#c1df8d]"
                >
                  Book at Alamo Golf Den <ExternalLink size={18} />
                </a>
                <Link
                  href="/play"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/24 px-6 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  QR registration
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-white/18 bg-[#0d1513]/78 p-5 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="flex items-center gap-3 border-b border-white/12 pb-4">
                <Trophy className="text-[#a8c878]" size={34} />
                <div>
                  <p className="text-sm font-bold text-[#a8c878]">
                    Active challenge
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Book. Register. Play.
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <div className="rounded-lg border border-[#a8c878]/40 bg-[#a8c878]/12 p-4">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[#a8c878]">
                    Hole-in-one prize
                  </p>
                  <p className="mt-2 text-4xl font-black">$10,000</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Verified entrants are eligible if they hit the ace.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/12 bg-white/8 p-4">
                    <p className="text-sm font-black">One active challenge</p>
                    <p className="mt-2 text-sm leading-6 text-white/66">
                      Simple onsite flow: book with Alamo, scan the QR, submit
                      the booking details, and play.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/12 bg-white/8 p-4">
                    <p className="text-sm font-black">E6 event code</p>
                    <p className="mt-2 text-sm leading-6 text-white/66">
                      Revealed only after the onsite booking is confirmed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[0.68fr_1fr] lg:px-12"
      >
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            How it works
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight">
            Book. Register. Play.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#53605a]">
            Pin2Win keeps the registration process quick so you can spend your
            session competing. Book through Alamo Golf Den first, then scan the
            QR code onsite and confirm the matched booking details to join the
            event in E6.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {playerSteps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="rounded-lg border border-[#ded6c8] bg-white p-5"
              >
                <Icon className="text-[#2f6b3f]" size={28} />
                <h3 className="mt-4 text-xl font-black">{step.title}</h3>
                <p className="mt-3 leading-7 text-[#59655f]">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
                One challenge
              </p>
              <h2 className="mt-4 text-4xl font-black">
                Book the challenge, confirm onsite, take the shot.
              </h2>
            </div>
            <Link
              href="/play"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
            >
              Start registration <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-9 grid gap-5">
            {challengeTypes.map((challenge) => (
              <article
                key={challenge.name}
                className="rounded-lg border border-[#e4ddcf] bg-[#fbf8f1] p-6"
              >
                <Trophy className="text-[#2f6b3f]" size={30} />
                <h3 className="mt-5 text-2xl font-black">{challenge.name}</h3>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-[#2f6b3f]">
                  {challenge.featuredPrize}
                </p>
                <p className="mt-3 leading-7 text-[#59655f]">
                  {challenge.description}
                </p>
                <Link
                  href={challenge.href}
                  className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#2f6b3f] px-5 text-sm font-black text-[#2f6b3f] transition hover:bg-[#e3edd8]"
                >
                  Enter challenge <ArrowRight size={17} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:px-12">
        <div className="rounded-lg bg-[#18211f] p-8 text-white">
          <BadgeCheck className="text-[#a8c878]" size={34} />
          <h2 className="mt-5 text-3xl font-black">
            Bring your E6 username. Bring your best shot.
          </h2>
          <p className="mt-4 leading-8 text-white/74">
            Your E6 account name helps connect your Pin2Win entry with the
            score you post during the challenge. Use the same name inside E6 so
            your result can be verified for prize eligibility.
          </p>
        </div>
        <div className="rounded-lg border border-[#ded6c8] bg-white p-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            Good to know
          </p>
          <h2 className="mt-4 text-3xl font-black">
            What you can play for
          </h2>
          <ul className="mt-6 space-y-4">
            {playerBenefits.map((point) => (
              <li key={point} className="flex gap-3 leading-7 text-[#59655f]">
                <BadgeCheck className="mt-1 shrink-0 text-[#2f6b3f]" size={20} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
