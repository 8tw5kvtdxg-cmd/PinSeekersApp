import { AdminShell } from "@/app/admin/admin-shell";
import { LiveEntryLog } from "@/app/admin/entries/live-entry-log";
import { requireAdminSession } from "@/lib/admin-auth";
import { clubhouseChallengeSlugs } from "@/lib/clubhouse";
import { listClubhouseEntryRecordsForChallenge } from "@/lib/clubhouse-entry-store";

const challengeSlug = clubhouseChallengeSlugs.holeInOne;

export default async function AdminEntriesPage() {
  await requireAdminSession("/admin/entries");

  const initialEntries = await listClubhouseEntryRecordsForChallenge(challengeSlug);

  return (
    <AdminShell
      eyebrow="Live entries"
      title="Hole-in-One entry log"
      description="Monitor QR registrations, matched Alamo bookings, simulator usernames, and result status for the active challenge."
    >
      <LiveEntryLog
        initialEntries={initialEntries}
        challengeFilter={challengeSlug}
      />
    </AdminShell>
  );
}
