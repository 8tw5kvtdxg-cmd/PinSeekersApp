import Link from "next/link";
import { ArrowLeft, ExternalLink, MailCheck } from "lucide-react";
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
  const relatedLocations = location
    ? locations
    : [
        {
          id: `booking-${locationSlug}`,
          name: pageTitle,
          slug: locationSlug,
          bookingUrl: null,
          websiteUrl: null,
          isActive: true,
        },
      ];

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
      <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-5">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-1 shrink-0 text-[#2f6b3f]" size={26} />
          <p className="leading-7 text-[#59655f]">
            This page is generated from the partner location slug and booking
            email records. New active locations added in the admin portal will
            appear on the booking email dashboard automatically.
          </p>
        </div>
      </section>

      <BookingEmailAnalytics
        bookings={allBookings}
        locations={relatedLocations}
        selectedLocationSlug={locationSlug}
      />
    </AdminShell>
  );
}
