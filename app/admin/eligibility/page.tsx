import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminEligibilityPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  await requireAdminSession("/admin/eligibility");
  const prisma = getPrismaClient();
  const holds = prisma ? await prisma.participationHold.findMany({ orderBy: { updatedAt: "desc" }, take: 100,
    include: { user: { select: { email: true, name: true } }, events: { orderBy: { createdAt: "asc" } } },
  }) : [];
  const notices = await searchParams;
  return <AdminShell eyebrow="Eligibility controls" title="Participation holds" description="Use an attributed hold when age, Texas residency, legal acceptance, fraud, or another eligibility fact is under review. An active hold prevents new Square checkout and hides the simulator event code; it does not void a paid entry or issue a refund.">
    {notices.error && <p className="mt-6 rounded bg-red-100 p-4 text-red-900">{notices.error}</p>}
    {notices.message && <p className="mt-6 rounded bg-green-100 p-4">{notices.message}</p>}
    {!prisma && <p className="mt-6 rounded bg-red-100 p-4">Database unavailable.</p>}
    <form action="/api/admin/participation-holds" method="post" className="mt-8 grid gap-3 rounded-xl border bg-white p-6">
      <label className="text-sm font-semibold">Player email<input name="email" type="email" required className="mt-1 w-full rounded border p-2" /></label>
      <label className="text-sm font-semibold">Attributed reason<textarea name="reason" required minLength={20} maxLength={2000} rows={3} className="mt-1 w-full rounded border p-2" /></label>
      <div className="flex gap-2 text-sm font-semibold"><button name="action" value="Hold" className="rounded bg-amber-100 px-4 py-2">Place hold</button><button name="action" value="Release" className="rounded bg-green-100 px-4 py-2">Release hold</button></div>
    </form>
    <div className="mt-7 space-y-4">{holds.map(h => <section key={h.id} className="rounded-xl border bg-white p-5"><h2 className="font-bold">{h.user.name} · {h.user.email} · {h.status}</h2><p className="mt-1 text-sm">Reason: {h.reason} · Held by {h.heldByEmail} · Released by {h.releasedByEmail || "—"}</p><details className="mt-2 text-sm"><summary className="cursor-pointer underline">History ({h.events.length})</summary><ul className="mt-2 space-y-1">{h.events.map(e => <li key={e.id}>{e.createdAt.toLocaleString()} · {e.actorEmail} · {e.action}: {e.reason}</li>)}</ul></details></section>)}</div>
    {!holds.length && <p className="mt-7 text-sm text-stone-600">No participation holds recorded.</p>}
  </AdminShell>;
}
