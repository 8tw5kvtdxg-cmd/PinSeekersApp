"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/locations", label: "Locations" },
  { href: "/rent", label: "Rent a bay" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/#how-it-works") {
      return pathname === "/";
    }

    return pathname === href;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#101816]/92 text-white shadow-lg shadow-black/12 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-12">
        <Link
          href="/"
          className="text-xl font-black tracking-[0.12em]"
          onClick={() => setIsOpen(false)}
        >
          PINSEEKERS
        </Link>

        <button
          aria-expanded={isOpen}
          aria-controls="site-menu"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex size-11 items-center justify-center rounded-md border border-white/18 bg-white/8 text-white transition hover:bg-white/14"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen ? (
        <div
          id="site-menu"
          className="fixed inset-x-0 top-[72px] z-50 border-t border-white/10 bg-[#101816]/96 px-6 py-5 shadow-xl shadow-black/24 backdrop-blur sm:px-10"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-semibold text-white/74 sm:flex-row sm:flex-wrap sm:items-center sm:gap-7">
            {[
              ...navigation,
              { href: "/app", label: "App" },
              { href: "/play", label: "Play now" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition hover:text-white",
                  isActive(item.href) && "text-[#a8c878]",
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
