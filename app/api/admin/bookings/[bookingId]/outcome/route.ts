import { getAdminRequestIdentity } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";
export async function POST(request: Request, { params }: {
    params: Promise<{
        bookingId: string;
    }>;
}) {
    const actor = await getAdminRequestIdentity(request);
    if (!actor)
        return Response.json({ error: "Admin login required." }, { status: 401 });
    const db = getPrismaClient();
    if (!db)
        return Response.json({ error: "Database unavailable." }, { status: 503 });
    const { bookingId } = await params;
    const body = await request.json().catch(() => ({}));
    if (!["Unknown", "Completed", "Cancelled", "No show"].includes(body.status) || typeof body.evidence !== "string" || body.evidence.trim().length < 10 || body.evidence.length > 1000 || !["Unknown", "Customer reported Pin2Win", "Partner referral record"].includes(body.acquisitionSource))
        return Response.json({ error: "Select an outcome and source, and provide an evidence reference (10–1000 characters)." }, { status: 400 });
    const booking = await db.bookingVerification.findUnique({ where: { id: bookingId } });
    if (!booking)
        return Response.json({ error: "Booking not found." }, { status: 404 });
    if (body.status === "Completed" && (booking.reservationEndsAt || booking.reservationStartsAt) > new Date())
        return Response.json({ error: "A future visit cannot be completed." }, { status: 400 });
    const data = { status: body.status, evidence: body.evidence.trim(), acquisitionSource: body.acquisitionSource };
    await db.$transaction([db.bookingVisitOutcome.upsert({ where: { bookingId }, create: { bookingId, ...data, updatedByEmail: actor.email }, update: { ...data, updatedByEmail: actor.email } }), db.bookingVisitOutcomeAudit.create({ data: { bookingId, ...data, actorEmail: actor.email } })]);
    return Response.json({ saved: true });
}
