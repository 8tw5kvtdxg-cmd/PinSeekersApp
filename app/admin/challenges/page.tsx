import { AdminShell } from "@/app/admin/admin-shell";
import { ChallengeAdminCard } from "./challenge-admin-card";
import { clubhouseChallenges } from "@/lib/clubhouse";
import { listClubhouseChallengeSettings } from "@/lib/clubhouse-challenge-settings";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";
import { getAppOrigin, getQrEntryUrl } from "@/lib/location-utils";
export default async function AdminChallengesPage() {
    await requireAdminSession('/admin/challenges');
    const settings = await listClubhouseChallengeSettings();
    const bays = await getPrismaClient()?.bay.findMany({ where: { isActive: true, location: { isActive: true } }, include: { location: true }, orderBy: { name: 'asc' } }) || [];
    return <AdminShell eyebrow="Challenge readiness" title="Challenge setup" description="Complete the challenge details, approve bays, and record the supervised rehearsal before opening sales.">
    <div className="mt-8 grid gap-6">{clubhouseChallenges.map(challenge => {
            const setting = settings.find(s => s.challengeSlug === challenge.slug)!;
            return <div key={challenge.slug}><ChallengeAdminCard challenge={challenge} setting={setting} bays={bays.map(b => ({ id: b.id, name: b.name, locationName: b.location.name }))}/>
        <div className="my-5 grid gap-2">{bays.filter(b => setting.bayIds.includes(b.id)).map(b => <a key={b.id} className="font-bold underline" href={getQrEntryUrl({ origin: getAppOrigin(), challengeSlug: challenge.slug, locationSlug: b.location.slug, bayName: b.name })}>{b.location.name} — {b.name}: approved bay entry link</a>)}</div>
      </div>;
        })}</div>
  </AdminShell>;
}
