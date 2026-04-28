import Link from "next/link";
import { MapPin, QrCode } from "lucide-react";

const bays = ["Bay 01", "Bay 02", "Bay 03", "Bay 04"];

export default function LocationsPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
          PinSeekers
        </Link>
        <section className="mt-10 rounded-lg bg-[#18211f] p-8 text-white">
          <MapPin className="text-[#c8f03f]" size={34} />
          <h1 className="mt-5 text-4xl font-black sm:text-5xl">Locations and bays</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/74">
            Each venue contains bays. Each bay can carry a QR code that deep
            links into the active PinSeekers challenge for that exact spot.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {bays.map((bay, index) => (
            <article key={bay} className="rounded-lg border border-[#ded6c8] bg-white p-5">
              <QrCode className="text-[#7c8d34]" size={30} />
              <h2 className="mt-4 text-2xl font-black">{bay}</h2>
              <p className="mt-2 leading-7 text-[#59655f]">
                QR code routes players to Minneapolis, {bay.toLowerCase()}, and
                challenge #{index + 1}.
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
