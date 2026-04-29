import Link from "next/link";
import { Trophy } from "lucide-react";

const leaderboards = [
  {
    title: "Closest to the Pin",
    resultLabel: "Distance",
    rows: [
      { rank: 1, player: "Maya Chen", location: "San Antonio", result: "2 ft 8 in" },
      { rank: 2, player: "Jordan Smith", location: "Austin", result: "4 ft 1 in" },
      { rank: 3, player: "Avery Jones", location: "Dallas", result: "5 ft 6 in" },
    ],
  },
  {
    title: "Longest Drive",
    resultLabel: "Distance",
    rows: [
      { rank: 1, player: "Evan Brooks", location: "Houston", result: "319 yd" },
      { rank: 2, player: "Taylor Kim", location: "San Antonio", result: "312 yd" },
      { rank: 3, player: "Sam Rivera", location: "Austin", result: "305 yd" },
    ],
  },
];

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
          PinSeekers
        </Link>
        <div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <Trophy className="text-[#7c8d34]" size={34} />
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">Leaderboards</h1>
          </div>
          <p className="max-w-xl text-lg leading-8 text-[#53605a]">
            Follow the weekly Closest to the Pin and Longest Drive races by
            player, result, and location.
          </p>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-2">
          {leaderboards.map((leaderboard) => (
            <section
              key={leaderboard.title}
              className="overflow-hidden rounded-lg border border-[#ded6c8] bg-white"
            >
              <div className="flex flex-col gap-2 bg-[#18211f] px-5 py-5 text-white sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-2xl font-black">{leaderboard.title}</h2>
                <p className="text-sm font-bold text-white/68">
                  Weekly payout leaderboard
                </p>
              </div>
              <div className="grid grid-cols-[60px_1.1fr_1fr_105px] gap-3 bg-[#f2eadb] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#53605a] sm:grid-cols-[70px_1.15fr_1fr_120px]">
                <span>Rank</span>
                <span>Player</span>
                <span>Location</span>
                <span>{leaderboard.resultLabel}</span>
              </div>
              {leaderboard.rows.map((row) => (
                <div
                  key={`${leaderboard.title}-${row.rank}`}
                  className="grid grid-cols-[60px_1.1fr_1fr_105px] gap-3 border-t border-[#ece5d8] px-5 py-5 text-sm sm:grid-cols-[70px_1.15fr_1fr_120px] sm:text-base"
                >
                  <span className="font-black">#{row.rank}</span>
                  <span className="font-bold">{row.player}</span>
                  <span className="text-[#53605a]">{row.location}</span>
                  <span className="font-black text-[#7c8d34]">{row.result}</span>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
