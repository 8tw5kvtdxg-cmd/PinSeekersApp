"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  QrCode,
  Save,
  ShieldCheck,
} from "lucide-react";
import type { ClubhouseChallenge } from "@/lib/clubhouse";
import { formatEntryFee } from "@/lib/clubhouse";

type ChallengeAdminCardProps = {
  challenge: ClubhouseChallenge;
};

export function ChallengeAdminCard({ challenge }: ChallengeAdminCardProps) {
  const [eventCode, setEventCode] = useState(challenge.e6JoinCode);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    let isMounted = true;

    async function loadEventCode() {
      const response = await fetch(
        `/api/clubhouse/challenges/${challenge.slug}/event-code`,
      );

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { eventCode?: string };

      if (isMounted && data.eventCode) {
        setEventCode(data.eventCode);
      }
    }

    loadEventCode();

    return () => {
      isMounted = false;
    };
  }, [challenge.slug]);

  async function saveEventCode() {
    setStatus("saving");

    const response = await fetch(
      `/api/clubhouse/challenges/${challenge.slug}/event-code`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventCode }),
      },
    );

    setStatus(response.ok ? "saved" : "error");
  }

  return (
    <article className="overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#e3edd8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#2f6b3f]">
              {challenge.status}
            </span>
            <span className="rounded-full bg-[#f2eadb] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
              {challenge.type === "CLOSEST_TO_PIN"
                ? "Closest to the Pin"
                : "Longest Drive"}
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-black">{challenge.name}</h2>
          <p className="mt-3 text-base leading-7 text-[#59655f]">
            {challenge.prizeSummary}
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                Venue
              </dt>
              <dd className="mt-1 font-bold">{challenge.venue}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                Entry
              </dt>
              <dd className="mt-1 font-bold">
                {formatEntryFee(challenge.entryFeeCents)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                E6 event
              </dt>
              <dd className="mt-1 font-bold">{challenge.e6EventName}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                Play window
              </dt>
              <dd className="mt-1 font-bold">
                {challenge.playWindowMinutes} minutes per paid entry
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg bg-[#fbf8f1] p-5">
          <div className="flex items-center gap-3">
            <KeyRound className="text-[#2f6b3f]" size={24} />
            <h3 className="text-xl font-black">Access codes</h3>
          </div>
          <div className="mt-5 space-y-4">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                E6 Event Join Code
              </span>
              <input
                className="h-12 rounded-md border border-[#ded6c8] bg-white px-4 font-black text-[#18211f] outline-none focus:border-[#2f6b3f]"
                value={eventCode}
                onChange={(event) => {
                  setEventCode(event.target.value);
                  setStatus("idle");
                }}
              />
            </label>
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935] disabled:cursor-not-allowed disabled:bg-[#ded6c8] disabled:text-[#6b756f]"
              disabled={status === "saving"}
              type="button"
              onClick={saveEventCode}
            >
              {status === "saved" ? <CheckCircle2 size={17} /> : <Save size={17} />}
              {status === "saving"
                ? "Saving..."
                : status === "saved"
                  ? "Saved"
                  : "Save event code"}
            </button>
            {status === "error" ? (
              <p className="text-sm font-bold text-[#9a3324]">
                The code could not be saved. Try again.
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={`/play/${challenge.slug}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-4 text-sm font-black text-white transition hover:bg-[#3f7f4c]"
              >
                <QrCode size={17} /> QR landing
              </Link>
              <a
                href={challenge.e6ClubhouseUrl}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-4 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={17} /> Clubhouse
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 border-t border-[#ece5d8] bg-[#fbf8f1] p-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="text-[#2f6b3f]" size={20} />
            <h3 className="font-black">Event timing</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#59655f]">
            {challenge.startsAt} through {challenge.endsAt}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[#2f6b3f]" size={20} />
            <h3 className="font-black">Eligibility rules</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#59655f]">
            {challenge.eligibilityRules.slice(0, 3).map((rule) => (
              <li key={rule}>- {rule}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
