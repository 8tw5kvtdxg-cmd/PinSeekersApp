"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type JackpotTickerProps = {
  label: string;
  initialWeeklyRevenue: number;
  className?: string;
  variant?: "light" | "dark";
};

const JACKPOT_RATE = 0.1;
const JACKPOT_CAP = 500;
const ENTRY_FEE = 20;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function JackpotTicker({
  label,
  initialWeeklyRevenue,
  className,
  variant = "light",
}: JackpotTickerProps) {
  const [weeklyRevenue, setWeeklyRevenue] = useState(initialWeeklyRevenue);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWeeklyRevenue((currentRevenue) => {
        const currentJackpot = currentRevenue * JACKPOT_RATE;

        if (currentJackpot >= JACKPOT_CAP) {
          return currentRevenue;
        }

        return currentRevenue + ENTRY_FEE;
      });
    }, 2600);

    return () => window.clearInterval(interval);
  }, []);

  const jackpot = useMemo(
    () => Math.min(weeklyRevenue * JACKPOT_RATE, JACKPOT_CAP),
    [weeklyRevenue],
  );

  const isCapped = jackpot >= JACKPOT_CAP;
  const isDark = variant === "dark";

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
              isDark ? "text-[#c8f03f]" : "text-[#7c8d34]",
            )}
          >
            Progressive jackpot
          </p>
          <h3 className="mt-2 text-lg font-black">{label}</h3>
        </div>
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
            isDark ? "bg-[#c8f03f] text-[#17200d]" : "bg-[#18211f] text-white",
          )}
        >
          <BadgeDollarSign size={22} />
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-4xl font-black leading-none">
          {currencyFormatter.format(jackpot)}
        </p>
        <span
          className={cn(
            "mb-1 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em]",
            isDark ? "text-white/70" : "text-[#53605a]",
          )}
        >
          <span className="relative flex size-2">
            <span
              className={cn(
                "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                isCapped ? "bg-white/40" : "bg-[#c8f03f]",
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                isCapped ? "bg-white/70" : "bg-[#7c8d34]",
              )}
            />
          </span>
          {isCapped ? "Capped" : "Accumulating"}
        </span>
      </div>

      <p className={cn("mt-3 text-sm leading-6", isDark ? "text-white/68" : "text-[#59655f]")}>
        10% of weekly entry revenue, capped at $500.
      </p>
    </div>
  );
}
