import { AdminShell } from "@/app/admin/admin-shell";
import { LiveEntryLog } from "@/app/admin/entries/live-entry-log";
import { requireAdminSession } from "@/lib/admin-auth";
import { clubhouseChallenges } from "@/lib/clubhouse";
import { listClubhouseEntryRecordsForChallenge } from "@/lib/clubhouse-entry-store";

export default async function AdminEntriesPage() {
  await requireAdminSession("/admin/entries");

  const initialEntries = (await Promise.all(clubhouseChallenges.map(({ slug }) => listClubhouseEntryRecordsForChallenge(slug)))).flat();

  return (
    <AdminShell
      eyebrow="Live entries"
      title="Hole-in-One entry log"
      description="Monitor QR registrations, matched Alamo bookings, simulator usernames, and result status across challenge runs."
    >
      <LiveEntryLog
        initialEntries={initialEntries}
      />
    </AdminShell>
  );
}
