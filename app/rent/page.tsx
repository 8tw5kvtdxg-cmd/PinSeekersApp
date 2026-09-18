import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  ExternalLink,
  Globe,
  MapPin,
} from "lucide-react";
import { listPartnerLocations, type PartnerLocationSummary } from "@/lib/partner-locations";
import { BookingLinkButton } from "@/app/rent/booking-link-button";

export const dynamic = "force-dynamic";

function locationAddress(location: PartnerLocationSummary) {
  return [location.address, location.city, location.state].filter(Boolean).join(", ");
}

export default async function RentBayPage() {
  const locations = (await listPartnerLocations()).filter(location => location.bookingUrl);

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          Pin2Win
        </Link>

        <section className="mt-10 rounded-lg bg-[#18211f] p-8 text-white">
          <CalendarCheck className="text-[#a8c878]" size={36} />
          <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-[#a8c878]">
            Book your bay
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Choose a partner location and reserve simulator time.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/74">
            Book and pay for simulator time directly with the venue. The Pin2Win challenge is optional and purchased separately when available.
          </p>
        </section>

        <section className="mt-8 grid gap-5">
          {locations.length === 0 ? (
            <div className="rounded-lg border border-[#ded6c8] bg-white p-8 text-center">
              <MapPin className="mx-auto text-[#2f6b3f]" size={34} />
              <h2 className="mt-4 text-2xl font-black">
                No booking pages available yet
              </h2>
              <p className="mt-3 text-sm font-bold leading-6 text-[#59655f]">
                Partner booking links will appear here as locations are added.
              </p>
            </div>
          ) : (
            locations.map((location) => (
              <article
                key={location.id}
                className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-lg shadow-[#18211f]/6"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <MapPin className="text-[#2f6b3f]" size={26} />
                      <h2 className="text-2xl font-black">{location.name}</h2>
                    </div>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-[#59655f]">
                      {locationAddress(location) || "Address coming soon"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {location.websiteUrl ? (
                        <a
                          href={location.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-4 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
                        >
                          <Globe size={16} />
                          Website
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <BookingLinkButton
                    bookingUrl={location.bookingUrl ?? "#"}
                    locationId={location.id}
                    locationName={location.name}
                    locationSlug={location.slug}
                  />
                </div>
              </article>
            ))
          )}
        </section>

        <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-6">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            After booking
          </p>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              "Arrive for your reserved simulator time.",
              "Enjoy your simulator session with your group.",
              "If a challenge is open, scan its approved bay QR to learn more.",
            ].map((detail) => (
              <li key={detail} className="flex gap-3 leading-7 text-[#59655f]">
                <BadgeCheck className="mt-1 shrink-0 text-[#2f6b3f]" size={20} />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
