import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, QrCode, Trophy } from "lucide-react";

const playerDetails = [
  "Scan the challenge QR code from the bay.",
  "Pay your entry and receive the E6 Event Join Code.",
  "Play the challenge in E6 during your simulator session.",
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
            Our current challenge experience is built for players already at
            the simulator bay. Scan the QR code, choose your event, and use the
            E6 code shown after payment to join the challenge.
          </p>
          <Link
            href="/play"
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#a8c878] px-6 text-sm font-black text-[#101816] transition hover:bg-[#c1df8d]"
          >
            Choose a challenge <ArrowRight size={18} />
          </Link>
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
            <h2 className="mt-4 text-2xl font-black">E6 Clubhouse events</h2>
            <p className="mt-3 leading-7 text-[#59655f]">
              After you enter, use the E6 Event Join Code from your confirmation
              page to play inside E6.
            </p>
          </article>
          <article className="rounded-lg border border-[#ded6c8] bg-white p-5">
            <BadgeCheck className="text-[#2f6b3f]" size={30} />
            <h2 className="mt-4 text-2xl font-black">Player details</h2>
            <p className="mt-3 leading-7 text-[#59655f]">
              Use your real name and E6 username so your entry can be matched
              with your challenge result.
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-6">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            What to expect
          </p>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
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
