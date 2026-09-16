import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPrivacyPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  await requireAdminSession("/admin/privacy");
  const prisma = getPrismaClient();
  const requests = prisma ? await prisma.privacyRequest.findMany({
    orderBy: [{ status: "asc" }, { dueAt: "asc" }], take: 100,
    include: { events: { orderBy: { createdAt: "asc" }, select: {
      id: true, action: true, actorEmail: true, note: true, customerText: true, createdAt: true,
    } } },
  }) : [];
  const notices = await searchParams;
  return <AdminShell eyebrow="Privacy operations" title="Privacy request queue" description="Track authenticated intake, verification, response targets, decisions, and appeals. This workflow records human decisions; it does not automatically export or delete protected records.">
    {notices.error && <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-900">{notices.error}</p>}
    {notices.message && <p className="mt-6 rounded-lg bg-green-100 p-4">{notices.message}</p>}
    {!prisma && <p className="mt-6 rounded-lg bg-red-100 p-4">Database unavailable.</p>}
    <div className="mt-7 space-y-5">{requests.map(r => <section key={r.id} className="rounded-2xl border bg-white p-6">
      <h2 className="text-xl font-bold">{r.requestType} · {r.status}{r.decision ? ` · ${r.decision}` : ""}</h2>
      <p className="mt-2 text-sm text-stone-600">Request {r.id} · {r.email} · received {r.createdAt.toLocaleString()} · target {r.dueAt.toLocaleString()}{r.dueAt < new Date() && r.status !== "Resolved" ? " · OVERDUE" : ""}</p>
      <p className="mt-1 text-sm">Identity: {r.identityStatus} · Handler: {r.handledByEmail || "unassigned"}{r.relatedRequestId ? ` · Appeal of ${r.relatedRequestId}` : ""}</p>
      {r.extensionReason && <p className="mt-2 text-sm">Extension reason: {r.extensionReason}</p>}
      <p className="mt-3 whitespace-pre-wrap rounded bg-stone-50 p-3 text-sm">{r.detail}</p>
      {r.response && <p className="mt-2 whitespace-pre-wrap text-sm">Customer response: {r.response}</p>}
      {r.fulfillmentReference && <p className="mt-2 text-sm">External fulfillment / delivery reference: {r.fulfillmentReference}</p>}
      <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">History ({r.events.length})</summary><ul className="mt-2 space-y-2">{r.events.map(e => <li key={e.id} className="border-t pt-2">{e.createdAt.toLocaleString()} · {e.actorEmail} · {e.action}{e.note ? ` · Internal: ${e.note}` : ""}{e.customerText ? ` · Customer: ${e.customerText}` : ""}</li>)}</ul></details>
      {r.status !== "Resolved" && <form action="/api/admin/privacy-requests" method="post" className="mt-5 grid gap-3 border-t pt-5">
        <input type="hidden" name="requestId" value={r.id} />
        <label className="text-sm font-semibold">Internal review note<textarea name="note" required minLength={10} maxLength={2000} rows={2} className="mt-1 w-full rounded border p-2" /></label>
        <label className="text-sm font-semibold">Customer-facing response (required for verification request, extension, completion, or decline)<textarea name="customerText" maxLength={2000} rows={3} className="mt-1 w-full rounded border p-2" /></label>
        <label className="text-sm font-semibold">External fulfillment or secure-delivery reference (required for Complete)<input name="fulfillmentReference" maxLength={200} className="mt-1 w-full rounded border p-2" /></label>
        <p className="text-xs text-stone-600">Confirm identity through an appropriate separate channel. Do not place tax IDs, ID scans, or full account exports in these notes or ordinary email. Declines must explain the reason and appeal route.</p>
        <div className="flex flex-wrap gap-2 text-sm font-semibold"><button name="action" value="In Review" className="rounded bg-stone-200 px-4 py-2">In review</button><button name="action" value="Need Verification" className="rounded bg-amber-100 px-4 py-2">Need verification</button><button name="action" value="Identity Verified" className="rounded bg-green-100 px-4 py-2">Identity verified</button>{!r.extendedAt && <button name="action" value="Extend" className="rounded bg-amber-100 px-4 py-2">Extend 45 days</button>}<button name="action" value="Complete" className="rounded bg-green-100 px-4 py-2">Complete</button><button name="action" value="Decline" className="rounded bg-red-100 px-4 py-2 text-red-900">Decline</button></div>
      </form>}
    </section>)}</div>
    {!requests.length && <p className="mt-8 rounded-lg bg-white p-6 text-stone-500">No privacy requests yet.</p>}
  </AdminShell>;
}
