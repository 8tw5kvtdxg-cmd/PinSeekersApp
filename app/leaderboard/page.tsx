import Link from "next/link";
import { Trophy } from "lucide-react";

const rows = [
  { rank: 1, player: "Maya Chen", challenge: "Closest to the Pin", result: "2 ft 8 in" },
  { rank: 2, player: "Evan Brooks", challenge: "Longest Drive", result: "319 yd" },
  { rank: 3, player: "Sam Rivera", challenge: "Hole-in-One", result: "Pending ace" },
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
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">Leaderboard</h1>
          </div>
          <p className="max-w-xl text-lg leading-8 text-[#53605a]">
            Scores update after staff enters simulator results in the admin
            dashboard. Automated simulator sync comes later.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
          <div className="grid grid-cols-[80px_1fr_1fr_140px] gap-4 bg-[#18211f] px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-white">
            <span>Rank</span>
            <span>Player</span>
            <span>Challenge</span>
            <span>Result</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.rank}
              className="grid grid-cols-[80px_1fr_1fr_140px] gap-4 border-t border-[#ece5d8] px-5 py-5 text-sm sm:text-base"
            >
              <span className="font-black">#{row.rank}</span>
              <span className="font-bold">{row.player}</span>
              <span className="text-[#53605a]">{row.challenge}</span>
              <span className="font-black text-[#7c8d34]">{row.result}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
