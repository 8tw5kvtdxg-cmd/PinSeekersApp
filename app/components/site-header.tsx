"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogIn, Menu, Trophy, UserPlus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/#platform", label: "Platform" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/locations", label: "Locations" },
  { href: "/contact#venues", label: "For venues" },
  { href: "/contact", label: "Contact" },
];

const accountActions = [
  { href: "/account#login", label: "Login", icon: LogIn },
  { href: "/account#create", label: "Create account", icon: UserPlus },
];

const playAction = { href: "/play", label: "Play now", icon: Trophy };
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dfe6df] bg-white/94 text-[#13201c] shadow-lg shadow-[#13201c]/8 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-3 text-xl font-black"
          onClick={() => setIsOpen(false)}
        >
          <span className="flex size-9 items-center justify-center rounded-md bg-[#13201c] text-sm text-white">
            P2W
          </span>
          <span>Pin2Win</span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-6 text-sm font-black text-[#51615b] lg:flex">
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

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href={playAction.href}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#13201c] px-4 text-sm font-black text-white shadow-lg shadow-[#13201c]/12 transition hover:bg-[#243630]",
                pathname === playAction.href && "ring-2 ring-[#7aa35d]/70",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Trophy size={17} /> {playAction.label}
            </Link>
            <Link
              href={partnerAction.href}
              className="hidden h-10 items-center justify-center gap-2 rounded-md border border-[#dfe6df] bg-[#f6f8f5] px-4 text-sm font-black text-[#13201c] transition hover:border-[#7aa35d] xl:inline-flex"
              onClick={() => setIsOpen(false)}
            >
              <Building2 size={17} /> {partnerAction.label}
            </Link>

            {accountActions.map((item) => {
              const Icon = item.icon;
              const isCreate = item.label === "Create account";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-black transition",
                    isCreate
                      ? "bg-[#2f6b3f] text-white hover:bg-[#3f7f4c]"
                      : "border border-[#dfe6df] bg-white text-[#13201c] hover:bg-[#f6f8f5]",
                    pathname === "/account" && "ring-1 ring-[#7aa35d]/70",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={17} /> {item.label}
                </Link>
              );
            })}
          </div>

          <button
            aria-expanded={isOpen}
            aria-controls="site-menu"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex size-11 items-center justify-center rounded-md border border-[#dfe6df] bg-white text-[#13201c] transition hover:bg-[#f6f8f5] lg:hidden"
            type="button"
            onClick={() => setIsOpen((current) => !current)}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          id="site-menu"
          className="fixed inset-x-0 top-[72px] z-50 border-t border-[#dfe6df] bg-white/98 px-6 py-5 shadow-xl shadow-[#13201c]/12 backdrop-blur sm:px-10"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-semibold text-[#51615b] sm:flex-row sm:flex-wrap sm:items-center sm:gap-7">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition hover:text-[#13201c]",
                  isActive(item.href) && "text-[#a8c878]",
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={playAction.href}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#13201c] px-4 text-sm font-black text-white transition hover:bg-[#243630] sm:hidden",
                pathname === playAction.href && "ring-2 ring-[#7aa35d]/70",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Trophy size={17} /> {playAction.label}
            </Link>
            <div className="flex flex-col gap-3 border-t border-[#dfe6df] pt-4 sm:hidden">
              {accountActions.map((item) => {
                const Icon = item.icon;
                const isCreate = item.label === "Create account";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-black transition",
                      isCreate
                        ? "bg-[#2f6b3f] text-white hover:bg-[#3f7f4c]"
                        : "border border-[#dfe6df] bg-white text-[#13201c] hover:bg-[#f6f8f5]",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={17} /> {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
