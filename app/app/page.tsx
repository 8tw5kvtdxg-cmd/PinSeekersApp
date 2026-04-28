import Link from "next/link";
import { ArrowRight, ClipboardList, MapPin, Trophy } from "lucide-react";

const areas = [
  {
    href: "/play",
    title: "Player flow",
    description: "QR landing, challenge selection, profile capture, and paid entry.",
    icon: ArrowRight,
  },
  {
    href: "/leaderboard",
    title: "Leaderboard",
    description: "Challenge standings after staff enters simulator results.",
    icon: Trophy,
  },
  {
    href: "/locations",
    title: "Locations",
    description: "Venue and bay structure for QR-code routing.",
    icon: MapPin,
  },
  {
    href: "/dashboard",
    title: "Admin dashboard",
    description: "Manual operations for starting play and entering scores.",
    icon: ClipboardList,
  },
];

export default function AppHomePage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
          PinSeekers
        </Link>
        <div className="mt-10 max-w-3xl">
          <h1 className="text-4xl font-black sm:text-5xl">Core app workspace</h1>
          <p className="mt-5 text-lg leading-8 text-[#53605a]">
            The POC is centered on the first business flow: scan, select, sign
            up, pay, play with staff assistance, enter results, and update the
            leaderboard.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {areas.map((area) => {
            const Icon = area.icon;

            return (
              <Link
                key={area.href}
                href={area.href}
                className="rounded-lg border border-[#ded6c8] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#18211f]/10"
              >
                <Icon className="text-[#7c8d34]" size={30} />
                <h2 className="mt-5 text-2xl font-black">{area.title}</h2>
                <p className="mt-3 leading-7 text-[#59655f]">{area.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
