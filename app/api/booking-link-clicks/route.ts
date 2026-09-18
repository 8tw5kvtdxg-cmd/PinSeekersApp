import { after } from 'next/server';
import { getPartnerLocation } from '@/lib/partner-locations';
import { getPrismaClient } from '@/lib/prisma';
import { approvedBookingUrl, isAutomatedVisit, referrerOrigin } from '@/lib/booking-link-policy';
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
    const slug = new URL(request.url).searchParams.get('locationSlug') || '';
    if (!/^[a-z0-9-]{1,120}$/.test(slug))
        return Response.json({ error: 'A valid partner location is required.' }, { status: 400 });
    let location;
    try {
        location = await getPartnerLocation(slug);
    }
    catch {
        return Response.json({ error: 'Booking information is temporarily unavailable. Please visit the venue website directly.' }, { status: 503 });
    }
    if (!location)
        return Response.json({ error: 'This partner location is unavailable.' }, { status: 404 });
    const destination = approvedBookingUrl(location.bookingUrl);
    if (!destination)
        return Response.json({ error: 'This venue does not have an approved booking link.' }, { status: 404 });
    const userAgent = (request.headers.get('user-agent') || '').slice(0, 500);
    if (!isAutomatedVisit(userAgent))
        after(async () => {
            try {
                const limit = await consumeRateLimit({ namespace: 'booking-click', identifier: `${getClientIp(request)}:${slug}`, limit: 1, windowMs: 60000 });
                if (!limit.allowed)
                    return;
                await getPrismaClient()?.bookingLinkClick.create({ data: { locationId: location.id, locationSlug: location.slug, locationName: location.name, bookingUrl: destination, referrer: referrerOrigin(request.headers.get('referer')), userAgent } });
            }
            catch {
                console.error('Booking click telemetry unavailable; customer redirect was preserved.');
            }
        });
    return new Response(null, { status: 302, headers: { Location: destination, 'Cache-Control': 'no-store' } });
}
// Booking telemetry is recorded only by the trusted redirect, not arbitrary public POSTs.
export async function POST() { return Response.json({ error: 'Use the partner booking link.' }, { status: 405, headers: { Allow: 'GET' } }); }
