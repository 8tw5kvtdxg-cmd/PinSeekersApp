import Link from "next/link";
import { ClipboardList, Flag, PencilLine } from "lucide-react";

const queue = [
  { player: "Jordan Smith", challenge: "Closest to the Pin", status: "Paid entry" },
  { player: "Taylor Kim", challenge: "Longest Drive", status: "Ready for staff" },
  { player: "Avery Jones", challenge: "Closest to the Pin", status: "Awaiting shots" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
          PinSeekers
        </Link>
        <div className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section>
            <ClipboardList className="text-[#7c8d34]" size={34} />
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">Admin dashboard</h1>
            <p className="mt-5 text-lg leading-8 text-[#53605a]">
              Staff manually starts the simulator session, enters shot data, and
              posts the result. This keeps the POC honest while payments and
              entries are validated.
            </p>
          </section>

          <section className="rounded-lg border border-[#ded6c8] bg-white p-6">
            <div className="flex items-center gap-3">
              <Flag className="text-[#7c8d34]" size={28} />
              <h2 className="text-2xl font-black">Entry queue</h2>
            </div>
            <div className="mt-5 space-y-3">
              {queue.map((item) => (
                <div
                  key={item.player}
                  className="grid gap-2 rounded-md bg-[#fbf8f1] p-4 sm:grid-cols-[1fr_1fr_150px]"
                >
                  <span className="font-black">{item.player}</span>
                  <span className="text-[#53605a]">{item.challenge}</span>
                  <span className="text-sm font-black text-[#7c8d34]">{item.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-[#18211f] p-6 text-white lg:col-span-2">
            <div className="flex items-center gap-3">
              <PencilLine className="text-[#c8f03f]" size={28} />
              <h2 className="text-2xl font-black">Manual result entry</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              {["Entry", "Shot distance", "Pin distance", "Final score"].map((label) => (
                <label key={label} className="grid gap-2 text-sm font-bold text-white/70">
                  {label}
                  <input className="h-12 rounded-md border border-white/16 bg-white/10 px-4 text-base text-white outline-none focus:border-[#c8f03f]" />
                </label>
              ))}
            </div>
            <button className="mt-5 h-12 rounded-md bg-[#c8f03f] px-6 text-sm font-black text-[#17200d] transition hover:bg-[#d7ff53]">
              Save result and update leaderboard
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
