import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export function AdminHomeLink() {
  return (
    <Link
      href="/admin"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
    >
      <LayoutDashboard size={18} /> Dashboard
    </Link>
  );
}
