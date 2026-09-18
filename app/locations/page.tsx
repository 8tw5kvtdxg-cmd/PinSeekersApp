import Link from 'next/link';
import { listPartnerLocations } from '@/lib/partner-locations';
import { BookingLinkButton } from '@/app/rent/booking-link-button';
export const dynamic = 'force-dynamic';
export default async function LocationsPage() {
    const locations = await listPartnerLocations();
    return <main className="min-h-screen bg-[#f8f4ec] px-6 py-12 text-[#18211f]"><div className="mx-auto max-w-6xl">
  <h1 className="text-4xl font-black">Find a partner venue</h1><p className="my-5 text-lg">Book simulator time directly with the venue. A Pin2Win challenge is optional, separately priced, and available only at approved bays while sales are open.</p>
  <div className="grid gap-6">{locations.map(location => <article className="rounded-lg border bg-white p-6" key={location.id}>
    <h2 className="text-2xl font-bold">{location.name}</h2><p className="my-4">{[location.address, location.city, location.state].filter(Boolean).join(', ')}</p>
    <div className="flex flex-wrap gap-4">{location.websiteUrl && <a className="rounded border px-5 py-3 font-bold" href={location.websiteUrl} target="_blank" rel="noreferrer">Venue website</a>}{location.bookingUrl && <BookingLinkButton bookingUrl={location.bookingUrl} locationId={location.id} locationName={location.name} locationSlug={location.slug}/>}</div>
  </article>)}</div>
  {!locations.length && <p>No active partner locations are available right now. <Link href="/contact" className="underline">Contact us</Link> for help.</p>}
 </div></main>;
}
