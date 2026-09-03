"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";

type EventCodePanelProps = {
  entryId: string;
};

export function EventCodePanel({
  entryId,
}: EventCodePanelProps) {
  const [savedPlayer, setSavedPlayer] = useState<{
    playerName: string | null;
    phoneNumber: string | null;
    e6DisplayName: string | null;
  }>({
    playerName: null,
    phoneNumber: null,
    e6DisplayName: null,
  });

  useEffect(() => {
    window.setTimeout(() => {
      const savedEntry = window.localStorage.getItem(`pin2win-entry-${entryId}`);

      if (!savedEntry) {
        return;
      }

      try {
        const entry = JSON.parse(savedEntry) as {
          playerName?: unknown;
          phoneNumber?: unknown;
          e6DisplayName?: unknown;
        };

        setSavedPlayer({
          playerName:
            typeof entry.playerName === "string" ? entry.playerName : null,
          phoneNumber:
            typeof entry.phoneNumber === "string" ? entry.phoneNumber : null,
          e6DisplayName:
            typeof entry.e6DisplayName === "string"
              ? entry.e6DisplayName
              : null,
        });
      } catch {
        window.localStorage.removeItem(`pin2win-entry-${entryId}`);
      }
    }, 0);
  }, [entryId]);

  const { playerName, phoneNumber, e6DisplayName } = savedPlayer;

  return (
    <div className="rounded-lg bg-[#fbf8f1] p-5">
      {playerName || phoneNumber || e6DisplayName ? (
        <div className="mb-5 rounded-md bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
            Saved player
          </p>
          <p className="mt-1 font-black">{playerName ?? "Player name needed"}</p>
          {phoneNumber ? (
            <p className="mt-1 text-sm font-bold text-[#59655f]">
              Phone: {phoneNumber}
            </p>
          ) : null}
          <p className="mt-1 text-sm font-bold text-[#59655f]">
            Simulator: {e6DisplayName ?? "Simulator account needed"}
          </p>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <KeyRound className="text-[#2f6b3f]" size={26} />
        <h2 className="text-xl font-black">Simulator Event Code</h2>
      </div>
      <p className="mt-4 rounded-md bg-white px-4 py-4 text-sm font-bold leading-6 text-[#59655f]">
        Event code access is available only on the payment-confirmed simulator
        access page.
      </p>
    </div>
  );
}
