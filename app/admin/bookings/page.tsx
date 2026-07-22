import { MailCheck } from "lucide-react";
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
      description="Store CC’d booking confirmations, match them to QR scans, and prevent reused bookings from revealing the E6 Event Join Code."
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

      <BookingVerificationConsole initialBookings={bookings} />
    </AdminShell>
  );
}
