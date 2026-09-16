import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminReconciliationPage() {
  await requireAdminSession("/admin/reconciliation");
  const prisma = getPrismaClient();
  const [issues, openCount, lastCheckout] = prisma
    ? await Promise.all([
        prisma.paymentReconciliationIssue.findMany({
          orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100,
        }),
        prisma.paymentReconciliationIssue.count({ where: { status: "Open" } }),
        prisma.squareCheckout.findFirst({
          where: { reconciledAt: { not: null } },
          orderBy: { reconciledAt: "desc" }, select: { reconciledAt: true },
        }),
      ])
    : [[], 0, null];

  return (
    <AdminShell
      eyebrow="Payment operations"
      title="Square reconciliation"
      description="Review payment and entry mismatches, confirmation-email retries, and automated recovery."
    >
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <p className="text-sm text-stone-600">
          {openCount} open issue{openCount === 1 ? "" : "s"} · Last checkout scan: {lastCheckout?.reconciledAt?.toLocaleString() ?? "Not run yet"}
        </p>
        <form action="/api/cron/payment-reconciliation" method="post" className="mt-4">
          <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white">
            Run reconciliation now
          </button>
        </form>
        <p className="mt-3 text-xs text-stone-500">The scheduled job runs daily; this button processes another batch of up to 20 Square checkouts and 20 entries.</p>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
            <tr><th className="px-4 py-3">Status</th><th className="px-4 py-3">Issue</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Detected</th><th className="px-4 py-3">Customer notice</th></tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.key} className="border-b border-stone-100 align-top">
                <td className="px-4 py-3">{issue.status}</td>
                <td className="px-4 py-3"><span className="font-semibold">{issue.type}</span><br /><span className="text-stone-600">{issue.detail}</span></td>
                <td className="px-4 py-3">{issue.entryId ? <Link href={`/admin/entries?entryId=${encodeURIComponent(issue.entryId)}`} className="underline">{issue.entryId}</Link> : issue.checkoutId ?? "—"}</td>
                <td className="px-4 py-3">{issue.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3">{issue.customerNotifiedAt?.toLocaleString() || (issue.customerEmail ? "Pending if unresolved" : "Staff only")}</td>
              </tr>
            ))}
            {!issues.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-500">No reconciliation issues recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
