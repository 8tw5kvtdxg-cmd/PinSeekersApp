import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminRefundsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  await requireAdminSession("/admin/refunds");
  const prisma = getPrismaClient();
  const claims = prisma ? await prisma.paymentIssueClaim.findMany({
    orderBy: { createdAt: "desc" }, take: 100,
    include: { events: { orderBy: { createdAt: "asc" } }, refund: true,
      evidenceFiles: { select: { id: true, originalName: true, sizeBytes: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
  }) : [];
  const checkoutIds = [...new Set(claims.map(claim => claim.checkoutId))];
  const [checkouts, entries] = prisma && checkoutIds.length ? await Promise.all([
    prisma.squareCheckout.findMany({ where: { id: { in: checkoutIds } }, select: {
      id: true, squareOrderId: true, squarePaymentId: true, status: true, refundStatus: true,
      amountCents: true, refundedAmountCents: true, accessRevealedAt: true,
    } }),
    prisma.clubhouseEntryRecord.findMany({ where: { squareCheckoutId: { in: checkoutIds } }, select: {
      squareCheckoutId: true, id: true, resultStatus: true, archivedAt: true, paymentStatus: true,
    } }),
  ]) : [[], []];
  const checkoutById = new Map(checkouts.map(checkout => [checkout.id, checkout]));
  const entryByCheckoutId = new Map(entries.map(entry => [entry.squareCheckoutId, entry]));
  const notices = await searchParams;
  return <AdminShell eyebrow="Payment operations" title="Refund claims" description="Review evidence, record a decision, then explicitly request a verified Square refund. Provider-pending refunds remain pending until Square confirms them.">
    {notices.error && <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-900">{notices.error}</p>}
    {notices.message && <p className="mt-6 rounded-lg bg-green-100 p-4 text-green-900">{notices.message}</p>}
    {!prisma && <p className="mt-6 rounded-lg bg-red-100 p-4">Database unavailable.</p>}
    <div className="mt-7 space-y-5">{claims.map(claim => <section key={claim.id} className="rounded-2xl border border-stone-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{claim.reason} · {claim.status}</h2><span className="text-sm text-stone-500">{claim.createdAt.toLocaleString()}</span></div>
      <p className="mt-2 text-sm">Claim {claim.id} · <Link href={`/admin/entries?entryId=${encodeURIComponent(claim.entryId || "")}`} className="underline">Entry {claim.entryId || "not recorded"}</Link> · Checkout {claim.checkoutId}</p>
      <p className="mt-1 text-sm text-stone-600">Square order {checkoutById.get(claim.checkoutId)?.squareOrderId || "unknown"} · Payment ID {checkoutById.get(claim.checkoutId)?.squarePaymentId || "unverified"} · Charge ${( (checkoutById.get(claim.checkoutId)?.amountCents || 0) / 100).toFixed(2)} · Provider refund state {checkoutById.get(claim.checkoutId)?.refundStatus || "unknown"}</p>
      <p className="mt-1 text-sm text-stone-600">Entry result {entryByCheckoutId.get(claim.checkoutId)?.resultStatus || "no entry"} · Code first revealed {checkoutById.get(claim.checkoutId)?.accessRevealedAt?.toLocaleString() || "not recorded"} · Entry archived {entryByCheckoutId.get(claim.checkoutId)?.archivedAt ? "yes" : "no"}</p>
      <p className="mt-1 text-sm">{claim.playerEmail} · Venue {claim.venueName || "unknown"} · Incident {claim.incidentAt?.toLocaleString() || "not supplied"} {claim.lateSubmissionFlag && <span className="font-semibold text-amber-700">· Timing review needed</span>}</p>
      <p className="mt-4 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-sm">{claim.narrative}</p>
      {claim.evidenceReference && <p className="mt-2 whitespace-pre-wrap text-sm">Evidence description: {claim.evidenceReference}</p>}
      {!!claim.evidenceFiles.length && <ul className="mt-3 space-y-1 text-sm">{claim.evidenceFiles.map(file => <li key={file.id}>
        <a href={`/api/payment-issues/evidence/${file.id}`} className="font-semibold underline">Download {file.originalName}</a> ({(file.sizeBytes / 1024).toFixed(0)} KB) · uploaded {file.createdAt.toLocaleString()}
      </li>)}</ul>}
      <p className="mt-3 text-sm">Assigned to: {claim.assignedTo || "Unassigned"}</p>
      {claim.refund && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">Square refund: {claim.refund.providerStatus} · ${(claim.refund.amountCents / 100).toFixed(2)} · Provider ID {claim.refund.providerRefundId || "not yet known"}</p>}
      {claim.refund?.providerStatus === "Unknown" && !claim.refund.providerRefundId && <form action="/api/admin/refunds" method="post" className="mt-3 flex flex-wrap gap-2">
        <input type="hidden" name="claimId" value={claim.id} /><input type="hidden" name="amountDollars" value={(claim.refund.amountCents / 100).toFixed(2)} />
        <input type="hidden" name="note" value="Retry uncertain Square response using the original idempotency key." />
        <button name="action" value="refund" className="rounded bg-amber-200 px-4 py-2 text-sm font-semibold">Retry same Square request</button>
        <span className="text-xs text-stone-500">Check Square first if the provider response was unclear.</span>
      </form>}
      <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">Decision history ({claim.events.length})</summary><ol className="mt-2 space-y-2">{claim.events.map(event => <li key={event.id} className="border-t pt-2">{event.createdAt.toLocaleString()} · {event.actorEmail} · {event.action}{event.note ? ` — internal: ${event.note}` : ""}{event.customerMessage ? ` — customer: ${event.customerMessage}` : ""}</li>)}</ol></details>
      {!claim.refund && <form action="/api/admin/refunds" method="post" className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2">
        <input type="hidden" name="claimId" value={claim.id} />
        <label className="text-sm font-semibold">Assign to <input name="assignedTo" defaultValue={claim.assignedTo || ""} maxLength={200} className="mt-1 w-full rounded border p-2" /></label>
        <label className="text-sm font-semibold">Refund amount, USD <input name="amountDollars" inputMode="decimal" placeholder="20.00" className="mt-1 w-full rounded border p-2" /></label>
        <label className="sm:col-span-2 text-sm font-semibold">Review note <textarea name="note" required minLength={10} maxLength={2000} rows={3} className="mt-1 w-full rounded border p-2" /></label>
        <label className="sm:col-span-2 text-sm font-semibold">Customer-facing explanation (required when approving or denying) <textarea name="customerMessage" maxLength={2000} rows={2} className="mt-1 w-full rounded border p-2" /></label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button name="action" value="In Review" className="rounded bg-stone-200 px-4 py-2 font-semibold">In review</button>
          <button name="action" value="Denied" className="rounded bg-red-100 px-4 py-2 font-semibold text-red-900">Deny</button>
          <button name="action" value="Approved" className="rounded bg-green-100 px-4 py-2 font-semibold text-green-900">Approve</button>
          {claim.status === "Approved" && <button name="action" value="refund" className="rounded bg-stone-900 px-4 py-2 font-semibold text-white">Request Square refund</button>}
        </div>
      </form>}
    </section>)}</div>
    {!claims.length && <p className="mt-8 rounded-lg bg-white p-6 text-stone-500">No payment issue claims yet.</p>}
  </AdminShell>;
}
