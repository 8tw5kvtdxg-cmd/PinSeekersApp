"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  LogIn,
  Menu,
  Trophy,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/locations", label: "Locations" },
];

const accountActions = [
  { href: "/account#login", label: "Login", icon: LogIn },
  { href: "/account#create", label: "Create", icon: UserPlus },
];

const playAction = { href: "/play", label: "Play now", icon: Trophy };
const bookAction = { href: "/rent", label: "Book your bay", icon: CalendarCheck };
const partnerAction = { href: "/contact", label: "Partner inquiry", icon: Building2 };

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (pathname.startsWith("/testing-portal")) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/#how-it-works") {
      return pathname === "/";
    }

    return pathname === href;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dfe6df] bg-white/96 text-[#13201c] shadow-sm shadow-[#13201c]/8 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="flex min-w-fit items-center gap-3 text-lg font-black sm:text-xl"
          onClick={() => setIsOpen(false)}
        >
          <span className="flex size-9 items-center justify-center rounded-md bg-[#13201c] text-sm text-white">
            P2W
          </span>
          <span>Pin2Win</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          <nav className="hidden min-w-0 items-center justify-center gap-5 text-sm font-black text-[#51615b] lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition hover:text-[#13201c]",
                  isActive(item.href) && "text-[#2f6b3f]",
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Link
              href={bookAction.href}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-4 text-sm font-black text-white shadow-sm shadow-[#2f6b3f]/15 transition hover:bg-[#245431]",
                pathname === bookAction.href && "ring-2 ring-[#7aa35d]/70",
              )}
              onClick={() => setIsOpen(false)}
            >
              <CalendarCheck size={17} /> {bookAction.label}
            </Link>
            <Link
              href={playAction.href}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dfe6df] bg-white px-4 text-sm font-black text-[#13201c] transition hover:bg-[#f6f8f5]",
                pathname === playAction.href && "ring-1 ring-[#7aa35d]/70",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Trophy size={17} /> {playAction.label}
            </Link>
            <Link
              href={partnerAction.href}
              className="hidden h-10 items-center justify-center gap-2 rounded-md border border-[#dfe6df] bg-white px-4 text-sm font-black text-[#13201c] transition hover:bg-[#f6f8f5] xl:inline-flex"
              onClick={() => setIsOpen(false)}
            >
              <Building2 size={17} /> {partnerAction.label}
            </Link>
            <Link
              href="/account#login"
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-black text-[#51615b] transition hover:bg-[#f6f8f5] hover:text-[#13201c]",
                pathname === "/account" && "text-[#2f6b3f]",
              )}
              onClick={() => setIsOpen(false)}
            >
              <LogIn size={17} /> Login
            </Link>
          </div>

          <button
            aria-expanded={isOpen}
            aria-controls="site-menu"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex size-11 items-center justify-center rounded-md border border-[#dfe6df] bg-white text-[#13201c] transition hover:bg-[#f6f8f5] lg:hidden"
            type="button"
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          id="site-menu"
          className="fixed inset-x-0 top-[68px] z-50 border-t border-[#dfe6df] bg-white/98 px-5 py-5 shadow-xl shadow-[#13201c]/12 backdrop-blur sm:px-8"
        >
          <nav className="mx-auto grid max-w-7xl gap-3 text-sm font-semibold text-[#51615b] sm:grid-cols-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 transition hover:bg-[#f6f8f5] hover:text-[#13201c]",
                  isActive(item.href) && "bg-[#eef7e9] text-[#2f6b3f]",
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className={cn(
                "rounded-md px-3 py-2 transition hover:bg-[#f6f8f5] hover:text-[#13201c]",
                pathname === "/contact" && "bg-[#eef7e9] text-[#2f6b3f]",
              )}
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
          </nav>

          <div className="mx-auto mt-4 grid max-w-7xl gap-3 border-t border-[#dfe6df] pt-4 sm:grid-cols-2">
            <Link
              href={bookAction.href}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-4 text-sm font-black text-white transition hover:bg-[#245431]",
                pathname === bookAction.href && "ring-2 ring-[#7aa35d]/70",
              )}
              onClick={() => setIsOpen(false)}
            >
              <CalendarCheck size={17} /> {bookAction.label}
            </Link>
            <Link
              href={playAction.href}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#dfe6df] bg-white px-4 text-sm font-black text-[#13201c] transition hover:bg-[#f6f8f5]",
                pathname === playAction.href && "ring-2 ring-[#7aa35d]/70",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Trophy size={17} /> {playAction.label}
            </Link>
            {accountActions.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#dfe6df] bg-white px-4 text-sm font-black text-[#13201c] transition hover:bg-[#f6f8f5]",
                    pathname === "/account" && "ring-1 ring-[#7aa35d]/70",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={17} /> {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
