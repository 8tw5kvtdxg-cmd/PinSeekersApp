import Link from "next/link";
import { Trophy } from "lucide-react";
import { JackpotTicker } from "@/app/components/jackpot-ticker";

const leaderboards = [
  {
    title: "Closest to the Pin",
    resultLabel: "Distance",
    weeklyRevenue: 3420,
    updateDelayMs: 3000,
    rows: [
      { rank: 1, player: "Maya Chen", location: "San Antonio", result: "2 ft 8 in" },
      { rank: 2, player: "Jordan Smith", location: "Austin", result: "4 ft 1 in" },
      { rank: 3, player: "Avery Jones", location: "Dallas", result: "5 ft 6 in" },
      { rank: 4, player: "Nico Alvarez", location: "Houston", result: "6 ft 2 in" },
      { rank: 5, player: "Priya Shah", location: "Austin", result: "7 ft 4 in" },
      { rank: 6, player: "Marcus Reed", location: "San Antonio", result: "8 ft 1 in" },
      { rank: 7, player: "Lena Ortiz", location: "Dallas", result: "9 ft 5 in" },
      { rank: 8, player: "Caleb Moore", location: "Houston", result: "10 ft 3 in" },
      { rank: 9, player: "Tessa Grant", location: "Austin", result: "11 ft 8 in" },
      { rank: 10, player: "Owen Blake", location: "San Antonio", result: "12 ft 6 in" },
    ],
  },
  {
    title: "Longest Drive",
    resultLabel: "Distance",
    weeklyRevenue: 2860,
    updateDelayMs: 9000,
    rows: [
      { rank: 1, player: "Evan Brooks", location: "Houston", result: "319 yd" },
      { rank: 2, player: "Taylor Kim", location: "San Antonio", result: "312 yd" },
      { rank: 3, player: "Sam Rivera", location: "Austin", result: "305 yd" },
      { rank: 4, player: "Drew Carter", location: "Dallas", result: "301 yd" },
      { rank: 5, player: "Andre Wilson", location: "Houston", result: "298 yd" },
      { rank: 6, player: "Miles Bennett", location: "Austin", result: "294 yd" },
      { rank: 7, player: "Chris Nguyen", location: "San Antonio", result: "291 yd" },
      { rank: 8, player: "Logan Price", location: "Dallas", result: "287 yd" },
      { rank: 9, player: "Isaac Torres", location: "Houston", result: "284 yd" },
      { rank: 10, player: "Ben Walker", location: "Austin", result: "281 yd" },
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
              <div className="border-b border-[#ece5d8] bg-[#fbf8f1] p-5">
                <JackpotTicker
                  label={`${leaderboard.title} weekly pot`}
                  initialWeeklyRevenue={leaderboard.weeklyRevenue}
                  updateDelayMs={leaderboard.updateDelayMs}
                />
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
