"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, Share2, Users } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/testing-portal")) {
    return null;
  }

  return (
    <footer className="bg-[#101816] px-6 py-12 text-white sm:px-10 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_0.9fr]">
        <div>
          <Link href="/" className="text-xl font-black tracking-[0.12em]">
            PIN2WIN
          </Link>
          <p className="mt-4 max-w-xl leading-7 text-white/66">
            Live golf simulator challenges for players chasing weekly payouts,
            progressive jackpots, and a featured hole-in-one prize.
          </p>
          <p className="mt-6 text-sm leading-6 text-white/46">
            Disclaimers: Prize eligibility, payout amounts, challenge rules,
            location availability, and entry requirements may vary by venue.
            Players must follow posted rules and local eligibility requirements.
            No purchase or paid entry should be offered where prohibited by law.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#a8c878]">
            Contact us
          </h2>
          <div className="mt-4 space-y-3 text-sm font-bold text-white/72">
            <Link href="/contact" className="flex items-center gap-3 hover:text-white">
              <Mail size={18} /> Contact page
            </Link>
            <a
              href="mailto:hello@pin2win.example"
              className="flex items-center gap-3 hover:text-white"
            >
              <Mail size={18} /> hello@pin2win.example
            </a>
            <Link href="/rent" className="flex items-center gap-3 hover:text-white">
              <MapPin size={18} /> Rent a bay
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#a8c878]">
            Social media
          </h2>
          <div className="mt-4 grid gap-3 text-sm font-bold text-white/72">
            <a
              href="#"
              className="flex items-center justify-between rounded-md bg-white/8 px-4 py-3 hover:bg-white/12 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Share2 size={18} /> Instagram
              </span>
              <span>@pin2win</span>
            </a>
            <a
              href="#"
              className="flex items-center justify-between rounded-md bg-white/8 px-4 py-3 hover:bg-white/12 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Share2 size={18} /> X / Twitter
              </span>
              <span>@pin2win</span>
            </a>
            <a
              href="#"
              className="flex items-center justify-between rounded-md bg-white/8 px-4 py-3 hover:bg-white/12 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Users size={18} /> LinkedIn
              </span>
              <span>Pin2Win</span>
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs font-bold text-white/42 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Pin2Win. All rights reserved.</p>
        <div className="flex flex-wrap gap-4">
          <a href="#" className="hover:text-white">
            Terms
          </a>
          <a href="#" className="hover:text-white">
            Privacy
          </a>
          <a href="#" className="hover:text-white">
            Official rules
          </a>
        </div>
      </div>
    </footer>
  );
}
