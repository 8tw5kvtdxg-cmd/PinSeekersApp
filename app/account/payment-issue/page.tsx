import { customerManagedClaimWhere } from "@/lib/refund-claim-source";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentVerifiedPlayer } from "@/lib/player-auth";
import { getPrismaClient } from "@/lib/prisma";
import { refundReasons } from "@/lib/refund-claims";

export const dynamic = "force-dynamic";

export default async function PaymentIssuePage({ searchParams }: { searchParams: Promise<{ submitted?: string; uploaded?: string; error?: string }> }) {
  const { player } = await getCurrentVerifiedPlayer();
  if (!player) redirect("/account#login");
  const prisma = getPrismaClient();
  const [checkouts, claims] = prisma ? await Promise.all([
    prisma.squareCheckout.findMany({
      where: { playerEmail: { equals: player.email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" }, take: 50,
      select: { id: true, squareOrderId: true, squarePaymentId: true, entryId: true, locationName: true, amountCents: true, status: true, refundStatus: true, createdAt: true },
    }),
    prisma.paymentIssueClaim.findMany({ where: { playerId: player.id, ...customerManagedClaimWhere }, orderBy: { createdAt: "desc" }, take: 50,
      include: { evidenceFiles: { select: { id: true, originalName: true, sizeBytes: true, createdAt: true }, orderBy: { createdAt: "asc" } } },
    }),
  ]) : [[], []];
  const { submitted, uploaded, error } = await searchParams;
  return <main className="min-h-screen bg-[#f8f4ec] px-5 py-10 text-[#18211f]">
    <div className="mx-auto max-w-3xl">
      <Link href="/locations" className="text-sm font-semibold underline">Back to locations</Link>
      <h1 className="mt-6 text-4xl font-black">Payment or refund claim</h1>
      <p className="mt-3 text-stone-600">Tell us what happened. A late submission is flagged for review, not automatically denied. Please do not include card numbers or sensitive identity documents.</p>
      {submitted && <p className="mt-5 rounded-lg bg-green-100 p-4 text-green-900">Claim {submitted} was submitted. You can check its status below.</p>}
      {uploaded && <p className="mt-5 rounded-lg bg-green-100 p-4 text-green-900">Evidence {uploaded} was attached to your claim.</p>}
      {error && <p className="mt-5 rounded-lg bg-red-100 p-4 text-red-900">{error}</p>}
      {!prisma && <p className="mt-5 rounded-lg bg-red-100 p-4">Claims are temporarily unavailable. Contact pin2wingolf@outlook.com.</p>}
      <form action="/api/account/payment-issues" method="post" encType="multipart/form-data" className="mt-8 space-y-4 rounded-2xl border bg-white p-6">
        <label className="block text-sm font-semibold">Payment record
          <select name="checkoutId" required className="mt-1 w-full rounded-lg border p-3">
            <option value="">Select a Square payment</option>
            {checkouts.map(c => <option key={c.id} value={c.id}>{c.createdAt.toLocaleDateString()} · ${ (c.amountCents / 100).toFixed(2) } · {c.locationName || "Location unknown"} · {c.squareOrderId} ({c.status})</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">Reason
          <select name="reason" required className="mt-1 w-full rounded-lg border p-3"><option value="">Select a reason</option>{refundReasons.map(reason => <option key={reason}>{reason}</option>)}</select>
        </label>
        <label className="block text-sm font-semibold">Venue or location <input name="venueName" maxLength={200} className="mt-1 w-full rounded-lg border p-3" /></label>
        <label className="block text-sm font-semibold">When did the issue happen? <input name="incidentAt" type="datetime-local" className="mt-1 w-full rounded-lg border p-3" /></label>
        <label className="block text-sm font-semibold">What happened? <textarea name="narrative" required minLength={20} maxLength={4000} rows={6} className="mt-1 w-full rounded-lg border p-3" /></label>
        <label className="block text-sm font-semibold">Evidence reference or description <textarea name="evidenceReference" maxLength={1000} rows={3} className="mt-1 w-full rounded-lg border p-3" placeholder="Describe a screenshot, receipt, or venue confirmation; do not paste private document links." /></label>
        <label className="block text-sm font-semibold">Attach one screenshot or receipt (optional)
          <input name="evidenceFile" type="file" accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf" className="mt-1 w-full rounded-lg border p-3" />
          <span className="mt-1 block text-xs font-normal text-stone-500">PNG, JPEG, or PDF only; maximum 3 MB. Do not upload payment-card numbers or identity documents.</span>
        </label>
        <button disabled={!checkouts.length} className="rounded-lg bg-[#18211f] px-5 py-3 font-semibold text-white disabled:opacity-50">Submit claim</button>
        {!checkouts.length && <p className="text-sm text-stone-600">No Square checkout found on this account. For a charge not listed here, email pin2wingolf@outlook.com.</p>}
      </form>
      <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Your claims</h2>
        <ul className="mt-4 space-y-5">{claims.map(c => <li key={c.id} className="border-t pt-3 text-sm"><span className="font-semibold">{c.reason}</span> · {c.status} · {c.createdAt.toLocaleDateString()}{c.lateSubmissionFlag ? " · Timing review" : ""}<br /><span className="text-stone-500">Claim {c.id} · Payment {c.checkoutId}</span>
          {!!c.evidenceFiles.length && <ul className="mt-2 space-y-1">{c.evidenceFiles.map(file => <li key={file.id}><a className="underline" href={`/api/payment-issues/evidence/${file.id}`}>{file.originalName}</a> ({(file.sizeBytes / 1024).toFixed(0)} KB)</li>)}</ul>}
          {!["Denied", "Refunded", "Partially Refunded", "Resolved"].includes(c.status) && c.evidenceFiles.length < 5 && <form action="/api/account/payment-issues/evidence" method="post" encType="multipart/form-data" className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="claimId" value={c.id} /><input name="evidenceFile" type="file" required accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf" className="max-w-full rounded border p-2" />
            <button className="rounded bg-stone-900 px-3 py-2 font-semibold text-white">Add evidence</button>
          </form>}
        </li>)}</ul>
        {!claims.length && <p className="mt-3 text-sm text-stone-500">No claims submitted.</p>}
      </section>
    </div>
  </main>;
}
