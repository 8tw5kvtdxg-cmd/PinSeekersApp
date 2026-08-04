import Link from "next/link";
import {
  ClipboardCheck,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  MailCheck,
  MapPin,
  PencilLine,
  UsersRound,
} from "lucide-react";
import { AdminLogoutForm } from "@/app/admin/logout-form";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: MailCheck },
  { href: "/admin/entries", label: "Entries", icon: ListChecks },
  { href: "/admin/results", label: "Results", icon: PencilLine },
  { href: "/admin/verification", label: "Review", icon: ClipboardCheck },
  { href: "/admin/challenges", label: "Event Code", icon: KeyRound },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/users", label: "Users", icon: UsersRound },
];

export function AdminPortalNav() {
  return (
    <div className="border-b border-[#ded6c8] bg-white px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-black text-[#53605a] transition hover:bg-[#f5efdf] hover:text-[#18211f]"
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </div>
        <AdminLogoutForm />
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  title,
  eyebrow = "Admin portal",
  description,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f8f4ec] text-[#18211f]">
      <AdminPortalNav />

      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">{title}</h1>
            {description ? (
              <p className="mt-4 max-w-3xl text-lg leading-8 text-[#53605a]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        {children}
      </div>
    </main>
  );
}
