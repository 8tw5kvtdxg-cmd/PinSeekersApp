"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";

type EventCodePanelProps = {
  challengeSlug: string;
  fallbackEventCode: string;
  entryId: string;
};

export function EventCodePanel({
  challengeSlug,
  fallbackEventCode,
  entryId,
}: EventCodePanelProps) {
  const [eventCode, setEventCode] = useState(fallbackEventCode);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [e6DisplayName, setE6DisplayName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEventCode() {
      const response = await fetch(
        `/api/clubhouse/challenges/${challengeSlug}/event-code`,
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
  }, [challengeSlug]);

  useEffect(() => {
    const savedEntry = window.localStorage.getItem(`pin2win-entry-${entryId}`);

    if (!savedEntry) {
      return;
    }

    try {
      const entry = JSON.parse(savedEntry) as {
        playerName?: unknown;
        e6DisplayName?: unknown;
      };

      if (typeof entry.playerName === "string") {
        setPlayerName(entry.playerName);
      }

      if (typeof entry.e6DisplayName === "string") {
        setE6DisplayName(entry.e6DisplayName);
      }
    } catch {
      window.localStorage.removeItem(`pin2win-entry-${entryId}`);
    }
  }, [entryId]);

  return (
    <div className="rounded-lg bg-[#fbf8f1] p-5">
      {playerName || e6DisplayName ? (
        <div className="mb-5 rounded-md bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
            Saved player
          </p>
          <p className="mt-1 font-black">{playerName ?? "Player name needed"}</p>
          <p className="mt-1 text-sm font-bold text-[#59655f]">
            E6: {e6DisplayName ?? "E6 account needed"}
          </p>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <KeyRound className="text-[#2f6b3f]" size={26} />
        <h2 className="text-xl font-black">E6 Event Join Code</h2>
      </div>
      <p className="mt-4 rounded-md bg-white px-4 py-4 text-2xl font-black tracking-[0.08em]">
        {eventCode}
      </p>
      <p className="mt-3 text-sm leading-6 text-[#59655f]">
        Enter this in E6 2026 using the Event option after the E6 event has
        started.
      </p>
    </div>
  );
}
