import { ArrowRight } from "lucide-react";

type BookingLinkButtonProps = {
  bookingUrl: string;
  locationId: string;
  locationName: string;
  locationSlug: string;
};

export function BookingLinkButton({
  bookingUrl,
  locationId,
  locationName,
  locationSlug,
}: BookingLinkButtonProps) {
  const trackingUrl = `/api/booking-link-clicks?${new URLSearchParams({
    bookingUrl,
    locationId,
    locationName,
    locationSlug,
  }).toString()}`;

  return (
    <a
      href={trackingUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-5 text-sm font-black text-white transition hover:bg-[#245431]"
    >
      Book at {locationName}
      <ArrowRight size={17} />
    </a>
  );
}
