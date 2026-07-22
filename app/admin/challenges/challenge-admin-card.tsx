"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, KeyRound, Save } from "lucide-react";
import type { ClubhouseChallenge } from "@/lib/clubhouse";
import { formatEntryFee } from "@/lib/clubhouse";
import type { ClubhouseChallengeSettingView } from "@/lib/clubhouse-challenge-settings";

type ChallengeAdminCardProps = {
  challenge: ClubhouseChallenge;
  setting: ClubhouseChallengeSettingView;
};

export function ChallengeAdminCard({
  challenge,
  setting,
}: ChallengeAdminCardProps) {
  const [eventCode, setEventCode] = useState(setting.e6EventCode);
  const [startsAt, setStartsAt] = useState(setting.startsAt);
  const [endsAt, setEndsAt] = useState(setting.endsAt);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      const response = await fetch(
        `/api/clubhouse/challenges/${challenge.slug}/event-code`,
      );

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        eventCode?: string;
        startsAt?: string;
        endsAt?: string;
      };

      if (!isMounted) {
        return;
      }

      setEventCode(data.eventCode ?? setting.e6EventCode);
      setStartsAt(data.startsAt ?? setting.startsAt);
      setEndsAt(data.endsAt ?? setting.endsAt);
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [challenge.slug, setting.e6EventCode, setting.endsAt, setting.startsAt]);

  function markDirty() {
    setStatus("idle");
    setMessage("");
  }

  async function saveSettings() {
    setStatus("saving");
    setMessage("");

    const response = await fetch(
      `/api/clubhouse/challenges/${challenge.slug}/event-code`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventCode, startsAt, endsAt }),
      },
    );

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      setStatus("error");
      setMessage(data.error ?? "The settings could not be saved.");
      return;
    }

    const data = (await response.json()) as {
      eventCode: string;
      startsAt: string;
      endsAt: string;
    };

    setEventCode(data.eventCode);
    setStartsAt(data.startsAt);
    setEndsAt(data.endsAt);
    setStatus("saved");
  }

  return (
    <article className="rounded-lg border border-[#ded6c8] bg-white p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#e3edd8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#2f6b3f]">
              Shared across locations
            </span>
            <span className="rounded-full bg-[#f2eadb] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
              Hole-in-One
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-black">{challenge.name}</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
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
                Play window
              </dt>
              <dd className="mt-1 font-bold">
                {challenge.playWindowMinutes} minutes
              </dd>
            </div>
          </dl>
        </div>

        <div className="w-full rounded-lg bg-[#fbf8f1] p-5 lg:max-w-xl">
          <div className="flex items-center gap-3">
            <KeyRound className="text-[#2f6b3f]" size={24} />
            <h3 className="text-xl font-black">Global E6 event code</h3>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                E6 Event Join Code
              </span>
              <input
                className="h-12 rounded-md border border-[#ded6c8] bg-white px-4 font-black text-[#18211f] outline-none focus:border-[#2f6b3f]"
                value={eventCode}
                onChange={(event) => {
                  setEventCode(event.target.value);
                  markDirty();
                }}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                  <CalendarClock size={15} /> Event start
                </span>
                <input
                  className="h-12 rounded-md border border-[#ded6c8] bg-white px-4 font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => {
                    setStartsAt(event.target.value);
                    markDirty();
                  }}
                />
              </label>
              <label className="grid gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
                  <CalendarClock size={15} /> Event end
                </span>
                <input
                  className="h-12 rounded-md border border-[#ded6c8] bg-white px-4 font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => {
                    setEndsAt(event.target.value);
                    markDirty();
                  }}
                />
              </label>
            </div>
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935] disabled:cursor-not-allowed disabled:bg-[#ded6c8] disabled:text-[#6b756f]"
              disabled={status === "saving"}
              type="button"
              onClick={saveSettings}
            >
              {status === "saved" ? <CheckCircle2 size={17} /> : <Save size={17} />}
              {status === "saving"
                ? "Saving..."
                : status === "saved"
                  ? "Saved"
                  : "Save shared settings"}
            </button>
            {status === "error" ? (
              <p className="text-sm font-bold text-[#9a3324]">{message}</p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
