import Link from "next/link";
import {
  CircleDollarSign,
  ClipboardCheck,
  KeyRound,
  ListChecks,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { ChallengeAdminCard } from "@/app/admin/challenges/challenge-admin-card";
import { clubhouseChallenges } from "@/lib/clubhouse";

export default function AdminChallengesPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              E6 Clubhouse workflow
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Challenge admin
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#53605a]">
              Prepare E6-hosted events with Pin2Win-controlled payment,
              eligibility, code reveal, and result verification.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/entries"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
            >
              <ListChecks size={18} /> Entry log
            </Link>
            <Link
              href="/admin/entries/longest-drive"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <Trophy size={18} /> Long Drive log
            </Link>
            <Link
              href="/admin/verification"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <ClipboardCheck size={18} /> Review results
            </Link>
          </div>
        </div>

        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          {[
            {
              icon: CircleDollarSign,
              title: "Pin2Win controls eligibility",
              text: "Payment creates the unique entry record, even when E6 uses one shared join code.",
            },
            {
              icon: KeyRound,
              title: "E6 code stays hidden",
              text: "Players only see the E6 Event Join Code after a successful Pin2Win entry.",
            },
            {
              icon: ShieldCheck,
              title: "Prize results are verified",
              text: "Only paid entries matched to E6 leaderboard results are eligible for payout.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-lg border border-[#ded6c8] bg-white p-5"
              >
                <Icon className="text-[#2f6b3f]" size={28} />
                <h2 className="mt-4 text-xl font-black">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#59655f]">
                  {item.text}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mt-10 grid gap-6">
          {clubhouseChallenges.map((challenge) => (
            <ChallengeAdminCard
              key={challenge.slug}
              challenge={challenge}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
