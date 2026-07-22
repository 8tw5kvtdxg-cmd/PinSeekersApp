import Link from "next/link";
import { Trophy } from "lucide-react";
import { clubhouseChallengeSlugs } from "@/lib/clubhouse";
import { getClubhouseLeaderboardRows } from "@/lib/clubhouse-entry-store";

const leaderboards = [
  {
    title: "Hole-in-One Challenge",
    resultLabel: "Distance",
    slug: clubhouseChallengeSlugs.holeInOne,
  },
];

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboardRows = await Promise.all(
    leaderboards.map((leaderboard) =>
      getClubhouseLeaderboardRows(leaderboard.slug),
    ),
  );

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
          Pin2Win
        </Link>
        <div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <Trophy className="text-[#2f6b3f]" size={34} />
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Verified results
            </h1>
          </div>
          <p className="max-w-xl text-lg leading-8 text-[#53605a]">
            Follow verified Hole-in-One challenge entries by player, E6
            username, and result.
          </p>
        </div>

        <div className="mt-10 grid gap-8">
          {leaderboards.map((leaderboard, index) => (
            <section
              key={leaderboard.title}
              className="overflow-hidden rounded-lg border border-[#ded6c8] bg-white"
            >
              <div className="flex flex-col gap-2 bg-[#18211f] px-5 py-5 text-white sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-2xl font-black">{leaderboard.title}</h2>
                <p className="text-sm font-bold text-white/68">
                  Reviewed challenge results
                </p>
              </div>
              <div className="grid grid-cols-[60px_1.1fr_1fr_105px] gap-3 bg-[#f2eadb] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#53605a] sm:grid-cols-[70px_1.15fr_1fr_120px]">
                <span>Rank</span>
                <span>Player</span>
                <span>E6 Username</span>
                <span>{leaderboard.resultLabel}</span>
              </div>
              {leaderboardRows[index].length === 0 ? (
                <div className="border-t border-[#ece5d8] px-5 py-8 text-center">
                  <p className="text-sm font-bold text-[#53605a]">
                    No verified results have been logged yet.
                  </p>
                </div>
              ) : (
                leaderboardRows[index].map((row) => (
                  <div
                    key={`${leaderboard.title}-${row.entryId}`}
                    className="grid grid-cols-[60px_1.1fr_1fr_105px] gap-3 border-t border-[#ece5d8] px-5 py-5 text-sm sm:grid-cols-[70px_1.15fr_1fr_120px] sm:text-base"
                  >
                    <span className="font-black">#{row.rank}</span>
                    <span className="font-bold">{row.playerName}</span>
                    <span className="text-[#53605a]">{row.e6DisplayName}</span>
                    <span className="font-black text-[#2f6b3f]">
                      {row.result}
                    </span>
                  </div>
                ))
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
