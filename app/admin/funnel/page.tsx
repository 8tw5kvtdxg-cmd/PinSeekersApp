import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";
import { partnerVisitMetrics } from "@/lib/partner-visit-metrics";
import { VisitOutcomeForm } from "./visit-outcome-form";
export const dynamic = "force-dynamic";
export default async function Page() {
    await requireAdminSession("/admin/funnel");
    const db = getPrismaClient();
    if (!db)
        return <AdminShell title="Partner reporting"><p>Database unavailable.</p></AdminShell>;
    const [locations, clicks, scans, bookings, outcomes] = await Promise.all([db.location.findMany({ orderBy: { name: "asc" } }), db.bookingLinkClick.groupBy({ by: ["locationSlug"], _count: true }), db.qrScan.groupBy({ by: ["locationSlug"], _count: true }), db.bookingVerification.findMany({ orderBy: { reservationStartsAt: "desc" } }), db.bookingVisitOutcome.findMany()]);
    return <AdminShell title="Partner reporting" description="All recorded history. Activity counts are separate from confirmed venue visits.">
 <p className="mb-6">Booking clicks are handoffs, not completed bookings. QR counts are entry-page loads and can include repeat visits and historical bots. Imported reservations do not establish attendance. Confirm visit outcomes using venue evidence below. Referral sources are reported evidence, not proof that Pin2Win caused a booking.</p>
 <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{["Venue", "Booking clicks", "QR page loads", "Imported reservations", "Confirmed completed bookings", "Identified visitors", "Repeat visitors", "Visits with referral evidence"].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{locations.map(location => { const rows = bookings.filter(b => b.locationSlug === location.slug); const metrics = partnerVisitMetrics(rows, outcomes); return <tr key={location.id}>{[location.name + (location.isActive ? "" : " (inactive)"), clicks.find(c => c.locationSlug === location.slug)?._count || 0, scans.find(c => c.locationSlug === location.slug)?._count || 0, rows.length, metrics.completed, metrics.identifiedCustomers, metrics.repeatCustomers, metrics.attributed].map((value, i) => <td className="p-2" key={i}>{value}</td>)}</tr>; })}</tbody></table></div>
 <p className="my-6">Repeat visitors have at least two confirmed visits at this venue at distinct reservation times, matched by email. Shared or changed email addresses and incomplete imports limit this measure. First observed visitors are not necessarily new to the venue. No acquisition or retention percentage is claimed.</p>
 <h2 className="my-4 text-xl font-bold">Confirm visit outcomes — latest 100 reservations</h2>
 {bookings.slice(0, 100).map(booking => { const outcome = outcomes.find(o => o.bookingId === booking.id); return <section className="my-4 rounded border p-4" key={booking.id}><p className="mb-3 font-bold">{booking.locationName} · {booking.customerName} · {booking.reservationStartsAt.toISOString()}</p><VisitOutcomeForm id={booking.id} status={outcome?.status} source={outcome?.acquisitionSource}/>{outcome && <p className="mt-2 text-sm">Last evidence: {outcome.evidence} · Recorded by {outcome.updatedByEmail}</p>}</section>; })}
 </AdminShell>;
}
