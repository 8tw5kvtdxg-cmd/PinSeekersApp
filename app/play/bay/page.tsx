import Link from "next/link";
import { redirect } from "next/navigation";
import { challengeSaleError } from "@/lib/challenge-readiness-policy";
import { getClubhouseChallenge } from "@/lib/clubhouse";
import { getPrismaClient } from "@/lib/prisma";

export default async function BayEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const prisma = getPrismaClient();
  if (prisma && typeof id === "string" && id) {
    const bay = await prisma.bay.findFirst({
      where: { id, isActive: true, location: { isActive: true } },
      include: { location: true, clubhouseAssignments: true },
    });
    if (bay) {
      const settings = await prisma.clubhouseChallengeSetting.findMany({
        where: {
          challengeSlug: { in: bay.clubhouseAssignments.map(({ challengeSlug }) => challengeSlug) },
          salesState: "Open",
        },
        orderBy: [{ startsAt: "desc" }, { challengeSlug: "asc" }],
      });
      const current = settings.find(
        (setting) => getClubhouseChallenge(setting.challengeSlug) && !challengeSaleError(setting),
      );
      if (current) {
        const query = new URLSearchParams({ location: bay.location.slug, bay: bay.name });
        redirect(`/play/${encodeURIComponent(current.challengeSlug)}?${query}`);
      }
      return (
        <main className="mx-auto max-w-xl p-8">
          <h1 className="text-3xl font-black">{bay.location.name} — {bay.name}</h1>
          <p className="my-6">No Pin2Win challenge is open for this bay right now. Scan this same QR code when entry opens.</p>
          <Link href="/rent" className="font-bold underline">Book simulator time</Link>
        </main>
      );
    }
  }
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-3xl font-black">Bay entry unavailable</h1>
      <p className="my-6">Ask venue staff for the current Pin2Win bay QR code.</p>
    </main>
  );
}
