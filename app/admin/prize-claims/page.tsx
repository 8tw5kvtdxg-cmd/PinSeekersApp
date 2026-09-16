import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";
import { potentialNoticeWeekdayTargetAt } from "@/lib/winner-claim-policy";

export const dynamic = "force-dynamic";

export default async function AdminPrizeClaimsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  await requireAdminSession("/admin/prize-claims");
  const prisma = getPrismaClient();
  const claims = prisma ? await prisma.winnerClaim.findMany({ orderBy: { createdAt: "desc" }, take: 100,
    include: { events: { orderBy: { createdAt: "asc" } }, report: { select: { shotAt: true, verifiedAt: true, status: true, simulatorProvider: true } } },
  }) : [];
  const notices = await searchParams;
  return <AdminShell eyebrow="Prize administration" title="Potential-winner claims" description="A verified shot and provisional chronology are not a prize payment. Record notice, response, eligibility, secure-document status, final review, CPA procedure, and an external payout separately." actions={<Link href="/admin/winners" className="rounded border bg-white px-4 py-2 text-sm font-semibold">Result review</Link>}>
    {notices.error && <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-900">{notices.error}</p>}
    {notices.message && <p className="mt-6 rounded-lg bg-green-100 p-4">{notices.message}</p>}
    {!prisma && <p className="mt-6 rounded-lg bg-red-100 p-4">Database unavailable.</p>}
    <div className="mt-7 space-y-6">{claims.map(c => <section key={c.id} className="rounded-2xl border bg-white p-6">
      <h2 className="text-xl font-bold">Claim {c.id} · {c.status}</h2>
      <p className="mt-2 text-sm text-stone-600">Report {c.reportId} · Entry {c.entryId} · {c.playerEmail} · Shot {c.report.shotAt?.toLocaleString() || "unknown"}</p>
      <p className="mt-1 text-sm">Notice: {c.noticeSentAt?.toLocaleString() || "not sent"} · Response target: {c.responseDueAt?.toLocaleString() || "not set"} · Response: {c.responseStatus}</p>
      <p className="mt-1 text-sm">Notice weekday target: {c.report.verifiedAt ? potentialNoticeWeekdayTargetAt(c.report.verifiedAt).toLocaleString() : "not set"} (confirm venue holidays) · Finalized: {c.finalizedAt?.toLocaleString() || "not finalized"} · Payout target: {c.payoutTargetAt?.toLocaleString() || "not set"}</p>
      <p className="mt-1 text-sm">Eligibility: {c.eligibilityStatus} · Identity: {c.identityStatus} · Residency: {c.residencyStatus} · Affidavit: {c.affidavitStatus} · W-9: {c.w9Status}</p>
      <p className="mt-1 text-sm">Secure collection method: {c.secureCollectionMethod || "not recorded"} · Tax review: {c.taxFormStatus}</p>
      <p className="mt-1 text-sm">Payout approval: {c.payoutApprovedAt?.toLocaleString() || "not approved"} · Amount: {c.payoutAmountCents ? `$${(c.payoutAmountCents / 100).toFixed(2)}` : "not set"} · Paid: {c.paidAt?.toLocaleString() || "not recorded"} · Method: {c.payoutMethod || "not set"}</p>
      <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">Attributed history ({c.events.length})</summary><ul className="mt-2 space-y-2">{c.events.map(e => <li key={e.id} className="border-t pt-2">{e.createdAt.toLocaleString()} · {e.actorEmail} · {e.action}{e.note ? ` · ${e.note}` : ""}</li>)}</ul></details>
      <form action="/api/admin/winner-claims" method="post" className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2">
        <input type="hidden" name="claimId" value={c.id} />
        <label className="text-sm font-semibold">Action<select name="action" required className="mt-1 w-full rounded border p-2"><option value="">Select action</option>{["Send Notice", "Response", "Eligibility", "Collection Method", "Identity", "Residency", "Affidavit", "W9", "Finalize", "Tax Review", "Approve Payout", "Paid"].map(a => <option key={a}>{a}</option>)}</select></label>
        <label className="text-sm font-semibold">Value (as applicable)<select name="value" className="mt-1 w-full rounded border p-2"><option value="">Select value</option>{["Accepted", "Refused", "Ineligible", "Not received", "Received securely", "Verified", "Rejected", "CPA review pending", "CPA approved procedure", "Form prepared", "Form delivered", "Not required per CPA"].map(v => <option key={v}>{v}</option>)}</select></label>
        <label className="text-sm font-semibold">External payout amount, USD (approval only)<input name="amountDollars" inputMode="decimal" placeholder="5000.00" className="mt-1 w-full rounded border p-2" /></label>
        <label className="text-sm font-semibold">External payout method or secure collection method description<input name="method" maxLength={100} className="mt-1 w-full rounded border p-2" /></label>
        <label className="sm:col-span-2 text-sm font-semibold">Attributed note<textarea name="note" required minLength={20} maxLength={2000} rows={3} className="mt-1 w-full rounded border p-2" /></label>
        <p className="sm:col-span-2 text-xs text-stone-600">For Collection Method or Paid, describe the external method in the method field. Never enter or email a tax ID, W-9 content, ID scan, or bank number. The Paid action records an external transfer; it does not move money.</p>
        <button className="rounded bg-stone-900 px-4 py-2 text-sm font-semibold text-white">Save claim action</button>
      </form>
    </section>)}</div>
    {!claims.length && <p className="mt-8 rounded-lg bg-white p-6 text-stone-500">No potential-winner claims opened yet. Open one from the result-review page only when chronology identifies a provisional leader.</p>}
  </AdminShell>;
}
