"use client";

import { useEffect, useState } from "react";
import { BadgeDollarSign } from "lucide-react";
import type { ClubhousePotSummary } from "@/lib/clubhouse-entry-store";
import { formatCurrency } from "@/lib/clubhouse";
import { cn } from "@/lib/utils";

type MonthlyPrizePotProps = {
  challengeSlug: string;
  initialSummary?: ClubhousePotSummary | null;
  variant?: "light" | "dark";
  className?: string;
};

export function MonthlyPrizePot({
  challengeSlug,
  initialSummary,
  variant = "light",
  className,
}: MonthlyPrizePotProps) {
  const [summary, setSummary] = useState(initialSummary ?? null);
  const isDark = variant === "dark";

  useEffect(() => {
    let isMounted = true;

    async function loadPot() {
      const response = await fetch(
        `/api/clubhouse/pots?challenge=${encodeURIComponent(challengeSlug)}&ts=${Date.now()}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        summary?: ClubhousePotSummary;
      };

      if (isMounted && data.summary) {
        setSummary(data.summary);
      }
    }

    loadPot();
    const interval = window.setInterval(loadPot, 2500);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [challengeSlug]);

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isDark
          ? "border-white/16 bg-white/10 text-white"
          : "border-[#ded6c8] bg-white text-[#18211f]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={cn(
              "text-xs font-black uppercase tracking-[0.14em]",
              isDark ? "text-[#a8c878]" : "text-[#2f6b3f]",
            )}
          >
            Monthly prize pot
          </p>
        </div>
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
            isDark ? "bg-[#2f6b3f] text-white" : "bg-[#18211f] text-white",
          )}
        >
          <BadgeDollarSign size={22} />
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-4xl font-black leading-none">
          {formatCurrency(summary?.potCents ?? 0)}
        </p>
        <span
          className={cn(
            "mb-1 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em]",
            isDark ? "text-white/70" : "text-[#53605a]",
          )}
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2f6b3f] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#2f6b3f]" />
          </span>
          Live
        </span>
      </div>

    </div>
  );
}
