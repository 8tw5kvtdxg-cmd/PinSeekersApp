import { KeyRound, MailCheck, Workflow } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { BookingVerificationConsole } from "@/app/admin/bookings/booking-verification-console";
import { requireAdminSession } from "@/lib/admin-auth";
import { listBookingVerificationRecords } from "@/lib/booking-verification-store";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireAdminSession("/admin/bookings");

  const bookings = await listBookingVerificationRecords();

  return (
    <AdminShell
      eyebrow="Booking verification"
      title="Alamo booking queue"
      description="Store CC’d booking confirmations, match them to QR scans, and prevent reused bookings from revealing the simulator event code."
    >
      <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-5">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-1 shrink-0 text-[#2f6b3f]" size={26} />
          <p className="leading-7 text-[#59655f]">
            Add CC&apos;d bookings here manually for the MVP. Automated inbox
            parsing can later create the same records with source set to Email CC.
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
                booking emails into the booking queue.
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

      <BookingVerificationConsole initialBookings={bookings} />
    </AdminShell>
  );
}
