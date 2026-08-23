import { AdminShell } from "@/app/admin/admin-shell";
import { BookingEmailAnalytics } from "@/app/admin/bookings/booking-email-analytics";
import { requireAdminSession } from "@/lib/admin-auth";
import { listBookingVerificationRecords } from "@/lib/booking-verification-store";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireAdminSession("/admin/bookings");

  const bookings = await listBookingVerificationRecords();

  return (
    <AdminShell
      eyebrow="Partner booking analytics"
      title="Booking email dashboard"
      description="Track incoming partner booking emails by month."
    >
      <BookingEmailAnalytics bookings={bookings} />
    </AdminShell>
  );
}
