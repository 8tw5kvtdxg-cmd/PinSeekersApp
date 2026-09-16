import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentVerifiedPlayer } from "@/lib/player-auth";
import { getPrismaClient } from "@/lib/prisma";
import { privacyRequestTypes } from "@/lib/privacy-requests";

export const dynamic = "force-dynamic";

export default async function PrivacyRequestPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const { player } = await getCurrentVerifiedPlayer();
  if (!player) redirect("/account#login");
  const prisma = getPrismaClient();
  const requests = prisma ? await prisma.privacyRequest.findMany({ where: { userId: player.id },
    orderBy: { createdAt: "desc" }, take: 100,
    include: { events: { where: { customerText: { not: null } }, select: { id: true, action: true, customerText: true, createdAt: true }, orderBy: { createdAt: "asc" } } },
  }) : [];
  const notices = await searchParams;
  const declined = requests.filter(r => r.decision === "Declined" && !requests.some(a => a.requestType === "Appeal" && a.relatedRequestId === r.id && a.status !== "Resolved"));
  return <main className="min-h-screen bg-[#f8f4ec] px-5 py-10 text-[#18211f]"><div className="mx-auto max-w-3xl">
    <Link href="/account" className="text-sm font-semibold underline">Back to account</Link>
    <h1 className="mt-6 text-4xl font-black">Privacy requests</h1>
    <p className="mt-3 text-stone-600">Request access, correction, deletion, a portable copy, opt-out, or appeal a decision. A signed-in account starts the request; we may need more identity verification before releasing or changing data. Do not enter Social Security numbers, ID scans, or payment-card numbers here.</p>
    {notices.submitted && <p className="mt-5 rounded-lg bg-green-100 p-4">Request {notices.submitted} received. Track its status below.</p>}
    {notices.error && <p className="mt-5 rounded-lg bg-red-100 p-4 text-red-900">{notices.error}</p>}
    {!prisma && <p className="mt-5 rounded-lg bg-red-100 p-4">Privacy requests are temporarily unavailable. Email pin2wingolf@outlook.com.</p>}
    <form action="/api/account/privacy-requests" method="post" className="mt-8 space-y-4 rounded-2xl border bg-white p-6">
      <label className="block text-sm font-semibold">Request type<select name="requestType" required className="mt-1 w-full rounded-lg border p-3"><option value="">Select a request</option>{privacyRequestTypes.filter(t => t !== "Appeal").map(type => <option key={type}>{type}</option>)}{declined.length > 0 && <option>Appeal</option>}</select></label>
      {declined.length > 0 && <label className="block text-sm font-semibold">Declined request to appeal (for appeals only)<select name="relatedRequestId" className="mt-1 w-full rounded-lg border p-3"><option value="">Select if appealing</option>{declined.map(r => <option key={r.id} value={r.id}>{r.requestType} · {r.id}</option>)}</select></label>}
      <label className="block text-sm font-semibold">What do you need?<textarea name="detail" required minLength={10} maxLength={2000} rows={5} className="mt-1 w-full rounded-lg border p-3" /></label>
      <button disabled={!prisma} className="rounded-lg bg-[#18211f] px-5 py-3 font-semibold text-white disabled:opacity-50">Submit privacy request</button>
    </form>
    <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Your requests</h2>
      <ul className="mt-4 space-y-5">{requests.map(r => <li key={r.id} className="border-t pt-3 text-sm"><p className="font-semibold">{r.requestType} · {r.status} {r.decision ? `· ${r.decision}` : ""}</p><p className="text-stone-600">Request {r.id} · received {r.createdAt.toLocaleDateString()} · response target {r.dueAt.toLocaleDateString()}</p><p className="text-stone-600">Identity: {r.identityStatus}</p>{r.response && <p className="mt-2 whitespace-pre-wrap rounded bg-stone-50 p-3">Response: {r.response}</p>}{r.decision === "Declined" && <p className="mt-2">You may appeal this decision here. If your appeal is denied, you may complain to the Texas Attorney General.</p>}{r.events.length > 0 && <details className="mt-2"><summary className="cursor-pointer underline">Updates ({r.events.length})</summary><ul className="mt-1 space-y-1">{r.events.map(e => <li key={e.id}>{e.createdAt.toLocaleString()} · {e.action}: {e.customerText}</li>)}</ul></details>}</li>)}</ul>
      {!requests.length && <p className="mt-3 text-sm text-stone-500">No requests submitted.</p>}
    </section>
  </div></main>;
}
