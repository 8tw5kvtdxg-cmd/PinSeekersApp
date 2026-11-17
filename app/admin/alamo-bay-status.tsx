import Link from "next/link";
import { alamoPosterBayName, alamoPosterChallengeId, alamoPosterLocation, bayEntryPath, findAlamoPosterBay, resolveBayEntry } from "@/lib/bay-entry";
import { formatEntryFee } from "@/lib/clubhouse";
import { getPrismaClient } from "@/lib/prisma";

export const alamoPreviewPath = "/admin/entry-preview";

const sanAntonioTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Chicago",
});

export async function AlamoBayStatus({ preview = false }: { preview?: boolean }) {
  const prisma = getPrismaClient();
  const posterBay = await findAlamoPosterBay();
  const result = posterBay ? await resolveBayEntry(posterBay.id) : null;
  const current = result?.current;
  const blockers = result?.blockers ?? [prisma ? "Alamo Golf Den Bay 1 was not found." : "Database is unavailable."];
  const squareConfigured = Boolean(process.env.SQUARE_ACCESS_TOKEN?.trim() && process.env.SQUARE_LOCATION_ID?.trim());
  const squareProduction = process.env.SQUARE_ENVIRONMENT === "production";
  const priorActivity = { locationSlug: alamoPosterLocation, bayName: alamoPosterBayName };
  const [lastLink, lastScan] = !preview && prisma ? await Promise.all([
    prisma.squareCheckout.findFirst({
      where: priorActivity,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, challengeSlug: true },
    }),
    prisma.qrScan.findFirst({
      where: priorActivity,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, bookingMatchStatus: true },
    }),
  ]) : [null, null];
  const readiness = current && squareConfigured && squareProduction;

  return (
    <section aria-labelledby="alamo-bay-status" className="mb-8 rounded-xl border border-[#ded6c8] bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="alamo-bay-status" className="text-2xl font-black">Alamo Golf Den · Bay 1</h2>
          <p className="mt-1 text-sm text-[#4a5b54]">{current?.challenge.name ?? "No challenge available from the QR"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${readiness ? "bg-[#e7f3e9] text-[#23583a]" : "bg-[#fff0d9] text-[#794a15]"}`}>
          {readiness ? "Configuration ready" : "Needs attention"}
        </span>
      </div>

      {blockers.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[#794a15]">
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}

      <dl className="mt-5 grid gap-4 border-y border-[#ded6c8] py-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-bold">Sales window · San Antonio time</dt>
          <dd className="mt-1 text-sm">
            {current?.setting.startsAt && current.setting.endsAt
              ? `${sanAntonioTime.format(current.setting.startsAt)} – ${sanAntonioTime.format(current.setting.endsAt)}`
              : "No open sales window selected"}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-bold">Square configuration</dt>
          <dd className="mt-1 text-sm">
            {!squareConfigured ? "Access token or location ID is missing." : squareProduction
              ? "Production settings present. Credentials untested."
              : "Sandbox settings present. Live checkout requires production settings."}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-bold">Simulator access setup</dt>
          <dd className="mt-1 text-sm">{current ? "An event code is configured for the selected run." : "No run selected."}</dd>
        </div>
        <div>
          <dt className="text-sm font-bold">Entry price</dt>
          <dd className="mt-1 text-sm">{current ? formatEntryFee(current.challenge.entryFeeCents) : "No run selected"}</dd>
        </div>
        {!preview && (
          <>
            <div>
              <dt className="text-sm font-bold">Last Square link recorded</dt>
              <dd className="mt-1 text-sm">{lastLink ? sanAntonioTime.format(lastLink.createdAt) : "None recorded for Bay 1"}</dd>
              {lastLink && current && lastLink.challengeSlug !== current.challenge.slug && <dd className="text-sm">From a previous or different run.</dd>}
            </div>
            <div>
              <dt className="text-sm font-bold">Latest scan booking status</dt>
              <dd className="mt-1 text-sm">
                {lastScan ? `${lastScan.bookingMatchStatus ?? "Status unavailable"} · ${sanAntonioTime.format(lastScan.createdAt)}` : "No scans recorded for Bay 1"}
              </dd>
            </div>
          </>
        )}
      </dl>

      {preview && (
        <div className="mt-5 space-y-2 text-sm">
          <p><strong>Printed poster URL path</strong> <code className="break-all">/play/{alamoPosterChallengeId}</code></p>
          <p><strong>Permanent bay route</strong> <code className="break-all">{posterBay ? bayEntryPath(posterBay.id) : "Unavailable"}</code></p>
          <p><strong>Customer entry destination</strong> <code className="break-all">{current?.path ?? "Unavailable"}</code></p>
          <p>Customers sign in or verify their account before proceeding to Square. This preview reads the current routing and configuration without recording a scan, sending a booking alert, or requesting a payment link.</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {preview ? (
          <a href={alamoPreviewPath} className="rounded-md bg-[#2f6b3f] px-4 py-2 text-sm font-bold text-white">Refresh readiness check</a>
        ) : (
          <Link href={alamoPreviewPath} prefetch={false} className="rounded-md bg-[#2f6b3f] px-4 py-2 text-sm font-bold text-white">Preview customer entry</Link>
        )}
        <Link href={result?.bay ? "/admin/challenges" : "/admin/locations"} className="rounded-md border border-[#ded6c8] px-4 py-2 text-sm font-bold">
          {result?.bay ? "Challenge Setup" : "Venue & bay settings"}
        </Link>
      </div>
    </section>
  );
}
