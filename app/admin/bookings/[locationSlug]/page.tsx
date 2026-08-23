import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { BookingEmailAnalytics } from "@/app/admin/bookings/booking-email-analytics";
import { requireAdminSession } from "@/lib/admin-auth";
import { listBookingVerificationRecords } from "@/lib/booking-verification-store";
import { listPartnerLocations } from "@/lib/partner-locations";

export const dynamic = "force-dynamic";

export default async function AdminPartnerBookingPage({
  params,
}: {
  params: Promise<{ locationSlug: string }>;
}) {
  const { locationSlug } = await params;

  await requireAdminSession(`/admin/bookings/${locationSlug}`);

  const [allBookings, locations] = await Promise.all([
    listBookingVerificationRecords(),
    listPartnerLocations(),
  ]);
  const location = locations.find(
    (partnerLocation) => partnerLocation.slug === locationSlug,
  );
  const locationBookings = allBookings.filter(
    (booking) => booking.locationSlug === locationSlug,
  );
  const pageTitle = location?.name ?? locationBookings[0]?.locationName ?? "Partner";

  return (
    <AdminShell
      eyebrow="Partner booking analytics"
      title={`${pageTitle} bookings`}
      description="Monitor incoming partner booking emails for this location and use the weekly/monthly trend to show booking demand."
      actions={
        <>
          <Link
            href="/admin/bookings"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-4 text-sm font-black text-[#53605a] transition hover:bg-[#f5efdf]"
          >
            <ArrowLeft size={17} /> All partners
          </Link>
          {location?.bookingUrl ? (
            <a
              href={location.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935]"
            >
              Booking page <ExternalLink size={17} />
            </a>
          ) : null}
        </>
      }
    >
      <BookingEmailAnalytics
        bookings={allBookings}
        selectedLocationSlug={locationSlug}
      />
    </AdminShell>
  );
}
