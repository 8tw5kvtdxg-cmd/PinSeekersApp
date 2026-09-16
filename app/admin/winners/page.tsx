import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { clubhouseChallengeSlugs } from "@/lib/clubhouse";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminWinnersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await requireAdminSession("/admin/winners");
  const params = await searchParams;
  const prisma = getPrismaClient();
  const slug = clubhouseChallengeSlugs.holeInOne;
  const [reports, chronology, setting] = prisma
    ? await Promise.all([
        prisma.holeInOneReport.findMany({
          where: { challengeSlug: slug },
          include: { entry: { select: { id: true, playerName: true, e6DisplayName: true, locationName: true, bayName: true, paymentStatus: true, entryDecisionStatus: true } }, events: { orderBy: { createdAt: "asc" } } },
          orderBy: { reportedAt: "desc" }, take: 100,
        }),
        prisma.winnerChronology.findUnique({ where: { challengeSlug: slug } }),
        prisma.clubhouseChallengeSetting.findUnique({ where: { challengeSlug: slug } }),
      ])
    : [[], null, null];
  const pendingCount = reports.filter((report) => report.status === "Pending Review").length;
  const verifiedCount = reports.filter((report) => report.status === "Verified").length;

  return (
    <AdminShell
      eyebrow="Result and winner infrastructure"
      title="Hole-in-one review"
      description="A player notice is only a potential result. Verification requires an authenticated simulator shot, a confirmed paid entry, evidence, and an individual administrator review. Prize claims and payouts are separate future steps."
      actions={<><Link href="/admin/verification" className="rounded-md border border-[#ded6c8] bg-white px-5 py-3 text-sm font-black">Confirm entry</Link><Link href="/admin/prize-claims" className="rounded-md border border-[#ded6c8] bg-white px-5 py-3 text-sm font-black">Prize claims</Link><Link href="/admin/challenges" className="rounded-md border border-[#ded6c8] bg-white px-5 py-3 text-sm font-black">Configure challenge period</Link></>}
    >
      {params.error && <p className="mt-6 rounded-lg bg-[#fff2ed] p-4 text-sm font-bold text-[#8d2f1f]">{params.error}</p>}
      {params.message && <p className="mt-6 rounded-lg bg-[#eef4e7] p-4 text-sm font-bold text-[#2f6b3f]">{params.message}</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#ded6c8] bg-white p-5"><p className="text-xs font-black uppercase text-[#87908a]">Sales</p><p className="mt-2 text-xl font-black">{setting?.salesState ?? "Open"}</p><p className="mt-1 text-sm text-[#59655f]">{setting?.salesHoldReason ?? "No result hold"}</p></div>
        <div className="rounded-lg border border-[#ded6c8] bg-white p-5"><p className="text-xs font-black uppercase text-[#87908a]">Review queue</p><p className="mt-2 text-xl font-black">{pendingCount} pending · {verifiedCount} verified</p></div>
        <div className="rounded-lg border border-[#ded6c8] bg-white p-5"><p className="text-xs font-black uppercase text-[#87908a]">Chronology</p><p className="mt-2 text-xl font-black">{chronology?.status ?? "No Verified Result"}</p><p className="mt-1 text-sm text-[#59655f]">{chronology?.provisionalReportId ? `Provisional report: ${chronology.provisionalReportId}` : "No prize winner determined"}</p></div>
      </div>
      <p className="mt-5 text-sm text-[#59655f]">Configured period: {setting?.startsAt?.toLocaleString() ?? "Not set"} – {setting?.endsAt?.toLocaleString() ?? "Not set"}. Verification is blocked until valid dates are configured.</p>
      {setting?.salesState === "Paused" && pendingCount === 0 && verifiedCount === 0 && (
        <form method="post" action="/api/admin/hole-in-one/review" className="mt-6 rounded-lg border border-[#ded6c8] bg-white p-5">
          <input type="hidden" name="action" value="resume" /><input type="hidden" name="challengeSlug" value={slug} />
          <label htmlFor="resume-note" className="block text-sm font-black">Resume sales after all reports were rejected</label>
          <textarea id="resume-note" name="note" required minLength={20} maxLength={2000} className="mt-2 min-h-20 w-full rounded-md border border-[#ded6c8] p-3" placeholder="Explain why the hold can be lifted." />
          <button className="mt-3 rounded-md bg-[#18211f] px-4 py-2 text-sm font-black text-white">Resume sales</button>
        </form>
      )}
      <div className="mt-8 grid gap-5">
        {reports.map((report) => (
          <article key={report.id} className="rounded-lg border border-[#ded6c8] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="text-xl font-black">{report.entry.playerName} · {report.status}</h2><p className="mt-1 text-sm text-[#59655f]">Report {report.id} · Entry {report.entry.id} · Received {report.reportedAt.toLocaleString()}</p></div>
              <span className="rounded-full bg-[#f2eadb] px-3 py-1 text-xs font-black">{report.reportSource} report</span>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-black">Entry</dt><dd>{report.entry.paymentStatus} payment · {report.entry.entryDecisionStatus ?? "Not confirmed"} · {report.entry.e6DisplayName}</dd></div>
              <div><dt className="font-black">Venue / bay</dt><dd>{report.entry.locationName} / {report.entry.bayName ?? "Not set"}</dd></div>
              <div><dt className="font-black">Simulator shot</dt><dd>{report.simulatorProvider ?? "Not attached"} · {report.simulatorSessionId ?? "—"} · {report.simulatorShotId ?? "—"}</dd></div>
              <div><dt className="font-black">Shot time</dt><dd>{report.shotAt?.toLocaleString() ?? "Awaiting simulator timestamp"}</dd></div>
              <div className="sm:col-span-2"><dt className="font-black">Evidence reference</dt><dd className="break-all">{report.evidenceReference ?? "Awaiting simulator evidence"}</dd></div>
              {report.playerStatement && <div className="sm:col-span-2"><dt className="font-black">Player statement</dt><dd className="whitespace-pre-wrap">{report.playerStatement}</dd></div>}
              {report.reviewNote && <div className="sm:col-span-2"><dt className="font-black">Review note</dt><dd className="whitespace-pre-wrap">{report.reviewNote}</dd></div>}
            </dl>
            {report.status === "Pending Review" && (
              <form method="post" action="/api/admin/hole-in-one/review" className="mt-6 border-t border-[#ece5d8] pt-5">
                <input type="hidden" name="reportId" value={report.id} />
                <label htmlFor={`note-${report.id}`} className="block text-sm font-black">Individual verifier note (minimum 20 characters)</label>
                <textarea id={`note-${report.id}`} name="note" required minLength={20} maxLength={2000} className="mt-2 min-h-24 w-full rounded-md border border-[#ded6c8] p-3" placeholder="Document simulator records, entry match, configuration, evidence, and reason for your decision." />
                <label className="mt-3 flex items-start gap-2 text-sm font-bold"><input type="checkbox" name="timestampReliable" className="mt-1" /> Simulator shot time is independently corroborated by reliable logs or evidence. Leave unchecked if chronology is uncertain.</label>
                <div className="mt-3 flex gap-3">
                  <button name="action" value="verify" className="rounded-md bg-[#2f6b3f] px-4 py-2 text-sm font-black text-white">Verify simulator result</button>
                  <button name="action" value="reject" className="rounded-md border border-[#ded6c8] px-4 py-2 text-sm font-black">Reject report</button>
                </div>
              </form>
            )}
            {report.status === "Verified" && chronology?.status === "Provisional" && chronology.provisionalReportId === report.id && (
              <form method="post" action="/api/admin/winner-claims" className="mt-5 border-t pt-4">
                <input type="hidden" name="reportId" value={report.id} />
                <label className="block text-sm font-semibold">Potential-winner claim note<textarea name="note" required minLength={20} maxLength={2000} rows={2} className="mt-2 w-full rounded border p-2" /></label>
                <button name="action" value="Open" className="mt-2 rounded bg-stone-900 px-4 py-2 text-sm font-semibold text-white">Open or view potential claim</button>
              </form>
            )}
            <details className="mt-5 text-sm"><summary className="cursor-pointer font-black">Immutable review history ({report.events.length})</summary><ul className="mt-3 list-disc space-y-2 pl-5">{report.events.map((event) => <li key={event.id}>{event.createdAt.toLocaleString()} · {event.action} · Actor {event.actorEmail ?? event.actorId}{event.note ? ` · ${event.note}` : ""}</li>)}</ul></details>
          </article>
        ))}
        {!reports.length && <p className="rounded-lg border border-[#ded6c8] bg-white p-8 text-center text-sm text-[#59655f]">No potential hole-in-one reports yet.</p>}
      </div>
    </AdminShell>
  );
}
