import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Search,
  Users,
} from "lucide-react";

const rentalLocations = [
  { city: "San Antonio", label: "Location name coming soon" },
  { city: "Houston", label: "Location name coming soon" },
  { city: "Austin", label: "Location name coming soon" },
  { city: "Dallas", label: "Location name coming soon" },
];

export default function RentBayPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]"
        >
          PinSeekers
        </Link>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
              Rent a bay
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Book simulator time at a PinSeekers location.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53605a]">
              Find a nearby location, choose a bay, and reserve time for your
              group. Location names and addresses can be added here as each
              venue goes live.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-4">
                <CalendarDays className="text-[#7c8d34]" size={26} />
                <p className="mt-3 text-sm font-black">Pick a date</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <Clock className="text-[#7c8d34]" size={26} />
                <p className="mt-3 text-sm font-black">Choose a time</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <Users className="text-[#7c8d34]" size={26} />
                <p className="mt-3 text-sm font-black">Bring your group</p>
              </div>
            </div>
          </div>

          <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
            <div className="flex items-center gap-3">
              <Search className="text-[#7c8d34]" size={28} />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
                  Location search
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Search for available bays
                </h2>
              </div>
            </div>

            <form className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                City or location
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#7c8d34]"
                  placeholder="Search San Antonio, Houston, Austin, or Dallas"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Date
                  <input
                    className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#7c8d34]"
                    type="date"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                  Party size
                  <input
                    className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#7c8d34]"
                    min="1"
                    placeholder="4"
                    type="number"
                  />
                </label>
              </div>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
                type="button"
              >
                <Search size={18} /> Search locations
              </button>
            </form>
          </section>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          {rentalLocations.map((location) => (
            <article
              key={location.city}
              className="rounded-lg border border-[#ded6c8] bg-white p-5"
            >
              <MapPin className="text-[#7c8d34]" size={30} />
              <h2 className="mt-4 text-2xl font-black">{location.city}</h2>
              <p className="mt-2 text-sm font-bold text-[#53605a]">
                {location.label}
              </p>
              <p className="mt-4 leading-7 text-[#59655f]">
                Address, bay count, hours, and booking rules can be added when
                this location is ready.
              </p>
              <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#ded6c8] px-4 text-sm font-black transition hover:border-[#7c8d34] hover:bg-[#fbf8f1]">
                View bays <ArrowRight size={17} />
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
