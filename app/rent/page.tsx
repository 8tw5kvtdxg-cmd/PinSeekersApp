import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  MapPin,
  MonitorPlay,
  QrCode,
  Trophy,
} from "lucide-react";

const sessionSteps = [
  {
    title: "Book your simulator time",
    description:
      "Reserve your bay through the location the same way you normally would.",
    icon: MapPin,
  },
  {
    title: "Scan the Pin2Win QR code",
    description:
      "Open the active challenge page from your phone once you are at the bay.",
    icon: QrCode,
  },
  {
    title: "Pay to enter",
    description:
      "Complete your entry and get the E6 Event Join Code on your confirmation page.",
    icon: CreditCard,
  },
  {
    title: "Play the challenge",
    description:
      "Enter the code in E6, take your shots, and check where you stand.",
    icon: MonitorPlay,
  },
];

export default function RentBayPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          Pin2Win
        </Link>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Before you play
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Book your bay first. Enter the challenge when you arrive.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53605a]">
              Pin2Win is for the challenge entry, not the bay reservation. Once
              your simulator time is set, scan the QR code at the bay to enter
              closest-to-the-pin or longest-drive events.
            </p>
            <div className="mt-8 rounded-lg bg-[#18211f] p-6 text-white">
              <Trophy className="text-[#a8c878]" size={30} />
              <h2 className="mt-4 text-2xl font-black">
                Challenge entry happens at the bay
              </h2>
              <p className="mt-3 leading-7 text-white/74">
                Keep your E6 username handy. You will use it when you enter so
                your challenge result can be matched after play.
              </p>
            </div>
          </div>

          <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Player workflow
            </p>
            <h2 className="mt-2 text-2xl font-black">
              From bay time to challenge time
            </h2>
            <div className="mt-6 grid gap-4">
              {sessionSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.title}
                    className="rounded-lg border border-[#ded6c8] bg-[#fbf8f1] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2f6b3f] text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <Icon className="text-[#2f6b3f]" size={24} />
                    </div>
                    <h3 className="mt-4 text-xl font-black">{step.title}</h3>
                    <p className="mt-3 leading-7 text-[#59655f]">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </section>

        <section className="mt-10 rounded-lg border border-[#ded6c8] bg-white p-6">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            Player path
          </p>
          <h2 className="mt-3 text-3xl font-black">
            Ready once you are at the simulator.
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-[#59655f]">
            When your bay is active, open the Pin2Win challenge page, complete
            your entry, and use the E6 code to join the event. The challenge is
            designed to fit into the simulator session you already booked.
          </p>
          <Link
            href="/play"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
          >
            See challenge pages <ArrowRight size={17} />
          </Link>
        </section>
      </div>
    </main>
  );
}
