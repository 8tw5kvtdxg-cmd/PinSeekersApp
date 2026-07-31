"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Mail, QrCode, Share2, Users } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/testing-portal")) {
    return null;
  }

  return (
    <footer className="bg-[#0f1b18] px-6 py-12 text-white sm:px-10 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_0.9fr]">
        <div>
          <Link href="/" className="flex items-center gap-3 text-xl font-black">
            <span className="flex size-9 items-center justify-center rounded-md bg-[#b7d37c] text-sm text-[#0f1b18]">
              P2W
            </span>
            <span>Pin2Win</span>
          </Link>
          <p className="mt-4 max-w-xl leading-7 text-white/66">
            Golf entertainment and marketing experiences for simulator venues,
            powered by QR entry, simulator challenge access, and partner
            promotion.
          </p>
          <p className="mt-6 text-sm leading-6 text-white/46">
            Disclaimers: Challenge rules, location availability, entry
            requirements, and partner participation may vary by venue. Players
            must follow posted rules and local eligibility requirements.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#a8c878]">
            Contact us
          </h2>
          <div className="mt-4 space-y-3 text-sm font-bold text-white/72">
            <Link href="/contact" className="flex items-center gap-3 hover:text-white">
              <Building2 size={18} /> Partner inquiry
            </Link>
            <a
              href="mailto:partners@pin2win.com"
              className="flex items-center gap-3 hover:text-white"
            >
              <Mail size={18} /> partners@pin2win.com
            </a>
            <Link href="/play" className="flex items-center gap-3 hover:text-white">
              <QrCode size={18} /> QR registration
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
