import Link from "next/link";
import {
  CalendarCheck,
  ClipboardCheck,
  ExternalLink,
  Globe,
  KeyRound,
  ListChecks,
  MapPin,
  PencilLine,
  Plus,
  QrCode,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { AdminPortalNav } from "@/app/admin/admin-shell";
import { AdminHomeLink } from "@/app/admin/admin-home-link";
import { requireAdminSession } from "@/lib/admin-auth";
import { clubhouseChallenges, formatCurrency } from "@/lib/clubhouse";
import {
  getClubhouseLocationRevenueSummaries,
  listClubhouseEntryRecordsForLocation,
} from "@/lib/clubhouse-entry-store";
import {
  getAppOrigin,
  getQrEntryUrl,
  getQrImageUrl,
} from "@/lib/location-utils";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const existingLocations = [
  {
    id: "existing-alamo-golf-den",
    name: "Alamo Golf Den",
    slug: "alamo-golf-den",
    address: "7001 I-10 #225",
    city: "San Antonio",
    state: "TX 78213",
    websiteUrl: "https://alamogolfden.com",
    bookingUrl: "https://alamogolfden.golf918.net/embed/y1snhpyhqamwoh5xo4lml",
    simulatorProvider: "E6_CONNECT",
    simulatorSoftwareName: null,
    isActive: true,
    isEditable: false,
    bays: [{ id: "existing-alamo-general", name: "General QR" }],
  },
];

const simulatorProviderLabels: Record<string, string> = {
  TRUGOLF_APOGEE_E6: "TruGolf Apogee + E6",
  E6_CONNECT: "E6 Connect",
  FLIGHTSCOPE_E6: "FlightScope + E6",
  MANUAL: "Manual / Staff Verified",
  OTHER: "Other / To be confirmed",
};

function formatSimulatorProvider(value: string | null | undefined) {
  return simulatorProviderLabels[value ?? "OTHER"] ?? simulatorProviderLabels.OTHER;
}

function formatSimulatorSoftware(location: {
  simulatorProvider: string | null | undefined;
  simulatorSoftwareName: string | null | undefined;
}) {
  return (
    location.simulatorSoftwareName?.trim() ||
    formatSimulatorProvider(location.simulatorProvider)
  );
}

type AdminLocationCard = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  simulatorProvider: string;
  simulatorSoftwareName: string | null;
  isActive: boolean;
  isEditable: boolean;
  bays: { id: string; name: string }[];
};

export default async function AdminLocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  await requireAdminSession("/admin/locations");
  const { location: requestedLocation } = await searchParams;

  const prisma = getPrismaClient();
  const origin = getAppOrigin();
  const dbLocations = prisma
    ? await prisma.location.findMany({
        orderBy: { createdAt: "desc" },
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
      .map<AdminLocationCard>((location) => ({
        id: location.id,
        name: location.name,
        slug: location.slug,
        address: location.address,
        city: location.city,
        state: location.state,
        websiteUrl: location.websiteUrl,
        bookingUrl: location.bookingUrl,
        simulatorProvider: location.simulatorProvider,
        simulatorSoftwareName: location.simulatorSoftwareName,
        isActive: location.isActive,
        isEditable: true,
        bays: location.bays.map((bay) => ({
          id: bay.id,
          name: bay.name,
        })),
      })),
  ];
  const revenueSummaryMap = await getClubhouseLocationRevenueSummaries();
  const selectedLocationSlug =
    requestedLocation && locations.some((location) => location.slug === requestedLocation)
      ? requestedLocation
      : locations[0]?.slug ?? "";
  const selectedLocation = locations.find(
    (location) => location.slug === selectedLocationSlug,
  );
  const selectedRevenueSummary =
    revenueSummaryMap[selectedLocationSlug] ??
    (selectedLocation
      ? {
          locationSlug: selectedLocation.slug,
          locationName: selectedLocation.name,
          entryCount: 0,
          revenueCents: 0,
          latestPaidAt: "",
        }
      : null);
  const selectedEntries = selectedLocation
    ? await listClubhouseEntryRecordsForLocation(selectedLocation.slug)
    : [];

  return (
    <main className="min-h-screen bg-[#f8f4ec] text-[#18211f]">
      <AdminPortalNav />
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Partner locations
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Partner QR and revenue log
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#53605a]">
              Create partner venues, generate bay-specific QR entry links, and
              review registered challenge revenue grouped by partner.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminHomeLink />
            <Link
              href="/admin/locations/new"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
            >
              <Plus size={18} /> Add new partner
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <UsersRound size={18} /> User log
            </Link>
            <Link
              href="/admin/challenges"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <KeyRound size={18} /> Challenge codes
            </Link>
            <Link
              href="/admin/entries"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <ListChecks size={18} /> Entry log
            </Link>
            <Link
              href="/admin/verification"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
            >
              <ClipboardCheck size={18} /> Review queue
            </Link>
          </div>
        </div>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-[#ded6c8] bg-white">
            <div className="border-b border-[#ded6c8] px-5 py-4">
              <h2 className="text-xl font-black">Partners</h2>
            </div>
            {!prisma ? (
              <p className="p-5 text-sm font-bold text-[#59655f]">
                Database is not configured. Showing existing built-in
                locations only.
              </p>
            ) : null}
            {locations.length === 0 ? (
              <p className="p-5 text-sm font-bold text-[#59655f]">
                No partner locations have been created yet.
              </p>
            ) : (
              <div className="grid gap-5 p-5">
                {locations.map((location) => (
                  <Link
                    key={location.id}
                    href={`/admin/locations?location=${encodeURIComponent(location.slug)}`}
                    className={`block rounded-lg border p-5 transition hover:border-[#2f6b3f] hover:bg-[#f4f8ef] ${
                      location.slug === selectedLocationSlug
                        ? "border-[#2f6b3f] bg-[#eef7e9]"
                        : "border-[#ece4d6] bg-[#fbf8f1]"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className="text-[#2f6b3f]" size={22} />
                          <h3 className="text-2xl font-black">
                            {location.name}
                          </h3>
                        </div>
                        <p className="mt-2 text-sm font-bold text-[#59655f]">
                          {[
                            location.address,
                            location.city,
                            location.state,
                          ]
                            .filter(Boolean)
                            .join(", ") || "No address on file"}
                        </p>
                        <p className="mt-2 font-mono text-xs text-[#6b756f]">
                          {location.slug}
                        </p>
                        {location.websiteUrl ? (
                          <span className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#2f6b3f]">
                            <Globe size={16} /> {location.websiteUrl.replace(/^https?:\/\//, "")}
                          </span>
                        ) : null}
                        {location.bookingUrl ? (
                          <span className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#2f6b3f]">
                            <CalendarCheck size={16} /> Booking page ready
                          </span>
                        ) : null}
                        <p className="mt-2 text-sm font-black text-[#59655f]">
                          Simulator: {formatSimulatorSoftware(location)}
                        </p>
                      </div>
                      <span className="rounded-md bg-[#eef7e9] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#2f6b3f]">
                        {location.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-4">
                      {location.isEditable ? (
                        <span className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white">
                          <PencilLine size={16} /> Select to edit below
                        </span>
                      ) : (
                        <span className="inline-flex h-10 items-center justify-center rounded-md border border-[#ded6c8] bg-white px-4 text-sm font-black text-[#59655f]">
                          Built-in location
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {(location.bays.length ? location.bays : [null]).map(
                        (bay) => (
                          <div
                            key={bay?.id ?? location.id}
                            className="rounded-lg border border-[#ded6c8] bg-white p-4"
                          >
                            <div className="flex items-center gap-2">
                              <QrCode className="text-[#2f6b3f]" size={20} />
                              <p className="font-black">
                                {bay?.name ?? "General QR"}
                              </p>
                            </div>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              {clubhouseChallenges.map((challenge) => {
                                const qrUrl = getQrEntryUrl({
                                  origin,
                                  challengeSlug: challenge.slug,
                                  locationSlug: location.slug,
                                  bayName:
                                    bay?.name === "General QR"
                                      ? null
                                      : bay?.name,
                                });

                                return (
                                  <div key={challenge.slug}>
                                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                                      {challenge.type.replaceAll("_", " ")}
                                    </p>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      alt={`${location.name} ${bay?.name ?? "general"} ${challenge.name} QR code`}
                                      className="mt-2 aspect-square w-full rounded-md border border-[#ece4d6] bg-white p-2"
                                      src={getQrImageUrl(qrUrl)}
                                    />
                                    <p className="mt-2 break-all font-mono text-[11px] leading-5 text-[#6b756f]">
                                      {qrUrl}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#ded6c8] bg-white">
            <div className="border-b border-[#ded6c8] px-5 py-4">
              <div className="flex items-center gap-2">
                <ReceiptText className="text-[#2f6b3f]" size={22} />
                <h2 className="text-xl font-black">Revenue by location</h2>
              </div>
            </div>
            {!selectedLocation || !selectedRevenueSummary ? (
              <p className="p-5 text-sm font-bold text-[#59655f]">
                Select a location to view revenue.
              </p>
            ) : (
              <div className="p-5">
                <div className="rounded-lg border border-[#ece4d6] bg-[#fbf8f1] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-black">
                        {selectedLocation.name}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#59655f]">
                        {[
                          selectedLocation.address,
                          selectedLocation.city,
                          selectedLocation.state,
                        ]
                          .filter(Boolean)
                          .join(", ") || "No address on file"}
                      </p>
                      <p className="mt-2 font-mono text-xs text-[#6b756f]">
                        {selectedLocation.slug}
                      </p>
                      {selectedLocation.websiteUrl ? (
                        <a
                          href={selectedLocation.websiteUrl}
                          className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#2f6b3f] transition hover:text-[#1f4e2e]"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Globe size={16} />
                          {selectedLocation.websiteUrl.replace(/^https?:\/\//, "")}
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                      {selectedLocation.bookingUrl ? (
                        <a
                          href={selectedLocation.bookingUrl}
                          className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#2f6b3f] transition hover:text-[#1f4e2e]"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <CalendarCheck size={16} />
                          Booking page
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                      <p className="mt-2 text-sm font-black text-[#59655f]">
                        Simulator: {formatSimulatorSoftware(selectedLocation)}
                      </p>
                    </div>
                    <p className="text-2xl font-black text-[#2f6b3f]">
                      {formatCurrency(selectedRevenueSummary.revenueCents)}
                    </p>
                  </div>
                  {selectedLocation.isEditable ? (
                    <Link
                      href={`/admin/locations/${selectedLocation.id}/edit`}
                      className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935]"
                    >
                      <PencilLine size={17} /> Edit partner
                    </Link>
                  ) : (
                    <p className="mt-5 rounded-md bg-white px-4 py-3 text-sm font-bold text-[#59655f]">
                      This is a built-in starter location. Create a partner
                      location record to manage editable venue details.
                    </p>
                  )}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                        Registered entries
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {selectedRevenueSummary.entryCount}
                      </p>
                    </div>
                    <div className="rounded-md bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                        Revenue
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {formatCurrency(selectedRevenueSummary.revenueCents)}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedEntries.length === 0 ? (
                  <p className="mt-5 rounded-md bg-[#fbf8f1] px-4 py-3 text-sm font-bold text-[#59655f]">
                    No location-attributed payments for this location yet.
                  </p>
                ) : (
                  <div className="mt-5 grid gap-2">
                    {selectedEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-md bg-[#fbf8f1] px-3 py-2 text-xs"
                      >
                        <p className="font-black">{entry.playerName}</p>
                        <p className="mt-1 text-[#59655f]">
                          {entry.bayName ?? "No bay"} -{" "}
                          {formatCurrency(entry.amountCents ?? 0)} -{" "}
                          {dateFormatter.format(new Date(entry.createdAt))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
