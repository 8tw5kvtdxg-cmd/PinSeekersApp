import {
  Globe,
  MapPin,
  QrCode,
} from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { ChallengeAdminCard } from "@/app/admin/challenges/challenge-admin-card";
import { clubhouseChallenges } from "@/lib/clubhouse";
import { listClubhouseChallengeSettings } from "@/lib/clubhouse-challenge-settings";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  getAppOrigin,
  getQrEntryUrl,
  getQrImageUrl,
} from "@/lib/location-utils";
import { getPrismaClient } from "@/lib/prisma";

const existingLocations = [
  {
    id: "existing-alamo-golf-den",
    name: "Alamo Golf Den",
    slug: "alamo-golf-den",
    websiteUrl: "https://alamogolfden.com",
    bays: [{ id: "existing-alamo-general", name: "General QR" }],
  },
];

export default async function AdminChallengesPage() {
  await requireAdminSession("/admin/challenges");
  const prisma = getPrismaClient();
  const origin = getAppOrigin();
  const challengeSettings = await listClubhouseChallengeSettings();
  const settingByChallengeSlug = new Map(
    challengeSettings.map((setting) => [setting.challengeSlug, setting]),
  );
  const dbLocations = prisma
    ? await prisma.location.findMany({
        orderBy: { name: "asc" },
        include: {
          bays: {
            where: { isActive: true },
            orderBy: { name: "asc" },
          },
        },
      })
    : [];
  const locations = [
    ...existingLocations,
    ...dbLocations
      .filter(
        (location) =>
          !existingLocations.some(
            (existingLocation) => existingLocation.slug === location.slug,
          ),
      )
      .map((location) => ({
        id: location.id,
        name: location.name,
        slug: location.slug,
        websiteUrl: location.websiteUrl,
        bays: location.bays.map((bay) => ({
          id: bay.id,
          name: bay.name,
        })),
      })),
  ];

  return (
    <AdminShell
      eyebrow="Global simulator setup"
      title="Challenge codes"
      description="Manage the shared simulator event code used by every partner location QR flow."
    >
        <section className="mt-10 grid gap-6">
          {clubhouseChallenges.map((challenge) => (
            <ChallengeAdminCard
              key={challenge.slug}
              challenge={challenge}
              setting={
                settingByChallengeSlug.get(challenge.slug) ?? {
                  challengeSlug: challenge.slug,
                  e6EventCode: challenge.e6JoinCode,
                  startsAt: "",
                  endsAt: "",
                }
              }
            />
          ))}
        </section>

        <section className="mt-10 rounded-lg border border-[#ded6c8] bg-white p-6">
          <div className="flex items-center gap-3">
            <MapPin className="text-[#2f6b3f]" size={28} />
            <div>
              <h2 className="text-2xl font-black">Location QR access</h2>
              <p className="mt-2 text-sm leading-6 text-[#59655f]">
                These QR links point customers into the correct location and
                bay flow. The simulator event codes above stay shared globally.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {locations.map((location) => (
              <article
                key={location.id}
                className="rounded-lg border border-[#ece4d6] bg-[#fbf8f1] p-5"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-xl font-black">{location.name}</h3>
                    <p className="mt-2 font-mono text-xs text-[#6b756f]">
                      {location.slug}
                    </p>
                    {location.websiteUrl ? (
                      <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#2f6b3f]">
                        <Globe size={16} />
                        {location.websiteUrl.replace(/^https?:\/\//, "")}
                      </p>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-md bg-[#eef7e9] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#2f6b3f]">
                    <QrCode size={15} /> QR ready
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {(location.bays.length ? location.bays : [null]).map(
                    (bay) =>
                      clubhouseChallenges.map((challenge) => {
                        const qrUrl = getQrEntryUrl({
                          origin,
                          challengeSlug: challenge.slug,
                          locationSlug: location.slug,
                          bayName:
                            bay?.name === "General QR" ? null : bay?.name,
                        });

                        return (
                          <div
                            key={`${bay?.id ?? location.id}-${challenge.slug}`}
                            className="rounded-md border border-[#ded6c8] bg-white p-3"
                          >
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                              {bay?.name ?? "General QR"} -{" "}
                              {challenge.type.replaceAll("_", " ")}
                            </p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={`${location.name} ${challenge.name} QR code`}
                              className="mt-3 aspect-square w-full rounded-md border border-[#ece4d6] bg-white p-2"
                              src={getQrImageUrl(qrUrl)}
                            />
                          </div>
                        );
                      }),
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

    </AdminShell>
  );
}
