import Link from "next/link";
import { MapPin, QrCode } from "lucide-react";

const locations = [
  { city: "San Antonio", bay: "Bay 01" },
  { city: "Houston", bay: "Bay 02" },
  { city: "Austin", bay: "Bay 03" },
  { city: "Dallas", bay: "Bay 04" },
];

export default function LocationsPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
          PinSeekers
        </Link>
        <section className="mt-10 rounded-lg bg-[#18211f] p-8 text-white">
          <MapPin className="text-[#c8f03f]" size={34} />
          <h1 className="mt-5 text-4xl font-black sm:text-5xl">
            Texas locations and bays
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/74">
            PinSeekers challenges are set up across San Antonio, Houston,
            Austin, and Dallas. Each bay QR code sends players to the right
            live challenge for that location.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {locations.map((location, index) => (
            <article
              key={location.city}
              className="rounded-lg border border-[#ded6c8] bg-white p-5"
            >
              <QrCode className="text-[#7c8d34]" size={30} />
              <h2 className="mt-4 text-2xl font-black">{location.city}</h2>
              <p className="mt-1 text-sm font-black text-[#7c8d34]">
                {location.bay}
              </p>
              <p className="mt-2 leading-7 text-[#59655f]">
                QR code routes players to {location.city}, {location.bay.toLowerCase()},
                and challenge #{index + 1}.
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
