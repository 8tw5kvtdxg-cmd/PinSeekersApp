import { KeyRound, MailCheck, Workflow } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { BookingEmailAnalytics } from "@/app/admin/bookings/booking-email-analytics";
import { requireAdminSession } from "@/lib/admin-auth";
import { listBookingVerificationRecords } from "@/lib/booking-verification-store";
import { listPartnerLocations } from "@/lib/partner-locations";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireAdminSession("/admin/bookings");

  const [bookings, locations] = await Promise.all([
    listBookingVerificationRecords(),
    listPartnerLocations(),
  ]);

  return (
    <AdminShell
      eyebrow="Partner booking analytics"
      title="Booking email dashboard"
      description="Track incoming partner booking emails so Pin2Win can show whether partner traffic is growing week by week and month by month."
    >
      <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-5">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-1 shrink-0 text-[#2f6b3f]" size={26} />
          <p className="leading-7 text-[#59655f]">
            Incoming booking confirmations from Alamo Golf Den and future
            partners are captured as partner booking activity. These counts help
            measure whether Pin2Win is increasing bookings for each location.
          </p>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#ded6c8] bg-white p-5">
          <div className="flex items-start gap-3">
            <Workflow className="mt-1 shrink-0 text-[#2f6b3f]" size={25} />
            <div>
              <h2 className="text-xl font-black">Automated email intake</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#59655f]">
                Connect Outlook, Zapier, Make, or Power Automate to POST parsed
                booking emails into this analytics dashboard.
              </p>
              <p className="mt-3 rounded-md bg-[#fbf8f1] px-3 py-2 font-mono text-xs text-[#59655f]">
                POST /api/booking-email-intake
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#ded6c8] bg-white p-5">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-1 shrink-0 text-[#2f6b3f]" size={25} />
            <div>
              <h2 className="text-xl font-black">Required secret</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#59655f]">
                Add `BOOKING_EMAIL_INTAKE_SECRET` in Vercel and send it as a
                Bearer token or `x-pin2win-intake-secret` header.
              </p>
            </div>
          </div>
        </div>
      </section>

      <BookingEmailAnalytics bookings={bookings} locations={locations} />
    </AdminShell>
  );
}
