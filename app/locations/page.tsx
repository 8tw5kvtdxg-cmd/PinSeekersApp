import Link from "next/link";
import {
  BadgeCheck,
  ExternalLink,
  Globe,
  MapPin,
  QrCode,
  Trophy,
} from "lucide-react";

const playerDetails = [
  "Create your Pin2Win entry from the QR landing page.",
  "Scan the challenge QR code when you arrive at the bay.",
  "Complete checkout to reveal the simulator event code.",
  "Play the challenge during your simulator session.",
];

export default function LocationsPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          Pin2Win
        </Link>

        <section className="mt-10 rounded-lg bg-[#18211f] p-8 text-white">
          <MapPin className="text-[#a8c878]" size={34} />
          <h1 className="mt-5 text-4xl font-black sm:text-5xl">
            Play Pin2Win at Alamo Golf Den
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/74">
            Alamo Golf Den is a Pin2Win partner location where players can scan
            onsite QR codes, complete a Pin2Win entry, and access the active
            simulator challenge experience.
          </p>
          <Link
            href="/play"
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#a8c878] px-6 text-sm font-black text-[#101816] transition hover:bg-[#c1df8d]"
          >
            Start QR registration <QrCode size={18} />
          </Link>
        </section>

        <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-6">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            Partner location
          </p>
          <h2 className="mt-3 text-2xl font-black">Alamo Golf Den</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="flex gap-3 rounded-lg bg-[#fbf8f1] p-4">
              <MapPin className="mt-0.5 shrink-0 text-[#2f6b3f]" size={22} />
              <p className="leading-7 text-[#59655f]">
                7001 I-10 #225, San Antonio, TX 78213
              </p>
            </div>
            <a
              href="https://alamogolfden.com"
              className="flex gap-3 rounded-lg bg-[#fbf8f1] p-4 leading-7 text-[#59655f] transition hover:bg-[#f5efdf]"
              target="_blank"
              rel="noreferrer"
            >
              <Globe className="mt-0.5 shrink-0 text-[#2f6b3f]" size={22} />
              <span className="font-bold">alamogolfden.com</span>
              <ExternalLink className="ml-auto shrink-0 text-[#2f6b3f]" size={18} />
            </a>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-[#ded6c8] bg-white p-5">
            <QrCode className="text-[#2f6b3f]" size={30} />
            <h2 className="mt-4 text-2xl font-black">Bay QR codes</h2>
            <p className="mt-3 leading-7 text-[#59655f]">
              Look for the Pin2Win QR code near the simulator bay to open the
              challenge entry page on your phone.
            </p>
          </article>
          <article className="rounded-lg border border-[#ded6c8] bg-white p-5">
            <Trophy className="text-[#2f6b3f]" size={30} />
            <h2 className="mt-4 text-2xl font-black">Simulator events</h2>
            <p className="mt-3 leading-7 text-[#59655f]">
              After checkout, use the simulator event code from your
              confirmation page to play the active challenge.
            </p>
          </article>
          <article className="rounded-lg border border-[#ded6c8] bg-white p-5">
            <BadgeCheck className="text-[#2f6b3f]" size={30} />
            <h2 className="mt-4 text-2xl font-black">Player details</h2>
            <p className="mt-3 leading-7 text-[#59655f]">
              Use your real name and simulator username so your entry can be
              matched with your challenge result.
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-6">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            What to expect
          </p>
          <ul className="mt-5 grid gap-3 md:grid-cols-4">
            {playerDetails.map((detail) => (
              <li key={detail} className="flex gap-3 leading-7 text-[#59655f]">
                <BadgeCheck className="mt-1 shrink-0 text-[#2f6b3f]" size={20} />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
