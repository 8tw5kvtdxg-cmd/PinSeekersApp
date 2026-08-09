import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  XCircle,
} from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { clubhouseChallenges } from "@/lib/clubhouse";
import { getClubhouseEventCode } from "@/lib/clubhouse-challenge-settings";
import { listClubhouseEntryRecordsForLocation } from "@/lib/clubhouse-entry-store";
import { getAppOrigin, getQrEntryUrl } from "@/lib/location-utils";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const builtInLocations = [
  {
    id: "existing-alamo-golf-den",
    name: "Alamo Golf Den",
    slug: "alamo-golf-den",
    address: "7001 I-10 #225",
    bookingUrl: "https://alamogolfden.golf918.net/embed/y1snhpyhqamwoh5xo4lml",
    simulatorProvider: "E6_CONNECT",
    simulatorSoftwareName: null,
    websiteUrl: "https://alamogolfden.com",
  },
];

type TestStatus = "fail" | "pass" | "warning";

type LaunchTestResult = {
  detail: string;
  label: string;
  status: TestStatus;
};

function getStatusStyles(status: TestStatus) {
  if (status === "pass") {
    return {
      bg: "bg-[#eef7e9]",
      icon: CheckCircle2,
      text: "text-[#2f6b3f]",
    };
  }

  if (status === "warning") {
    return {
      bg: "bg-[#fff8e8]",
      icon: AlertCircle,
      text: "text-[#8a6419]",
    };
  }

  return {
    bg: "bg-[#fff1f1]",
    icon: XCircle,
    text: "text-[#9b1c1c]",
  };
}

function isValidExternalUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function testBookingLink(bookingUrl: string | null) {
  if (!bookingUrl || !isValidExternalUrl(bookingUrl)) {
    return {
      detail: "Add a valid partner booking URL before launch.",
      label: "Booking link opens",
      status: "fail" as const,
    };
  }

  const verifiedBookingUrl = bookingUrl;

  try {
    const response = await fetch(verifiedBookingUrl, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });

    return {
      detail:
        response.status < 500
          ? `Partner booking page responded with HTTP ${response.status}.`
          : `Partner booking page returned HTTP ${response.status}.`,
      label: "Booking link opens",
      status: response.status < 500 ? ("pass" as const) : ("warning" as const),
    };
  } catch {
    return {
      detail:
        "The URL is saved, but Pin2Win could not verify the external booking page from this environment.",
      label: "Booking link opens",
      status: "warning" as const,
    };
  }
}

export default async function AdminLaunchTestPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  await requireAdminSession("/admin/launch-test");

  const { location: requestedLocation } = await searchParams;
  const prisma = getPrismaClient();
  const dbLocations = prisma
    ? await prisma.location.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          bookingUrl: true,
          simulatorProvider: true,
          simulatorSoftwareName: true,
          websiteUrl: true,
        },
        where: { isActive: true },
      })
    : [];
  const locations = [
    ...builtInLocations,
    ...dbLocations.filter(
      (location) =>
        !builtInLocations.some(
          (builtInLocation) => builtInLocation.slug === location.slug,
        ),
    ),
  ];
  const selectedLocation =
    locations.find((location) => location.slug === requestedLocation) ??
    locations[0] ??
    null;
  const activeChallenge = clubhouseChallenges[0];
  const eventCode = activeChallenge
    ? await getClubhouseEventCode(activeChallenge.slug)
    : null;
  const entries = selectedLocation
    ? await listClubhouseEntryRecordsForLocation(selectedLocation.slug)
    : [];
  const qrUrl =
    selectedLocation && activeChallenge
      ? getQrEntryUrl({
          origin: getAppOrigin(),
          challengeSlug: activeChallenge.slug,
          locationSlug: selectedLocation.slug,
          bayName: null,
        })
      : "";
  const bookingLinkTest = await testBookingLink(
    selectedLocation?.bookingUrl ?? null,
  );
  const trackingReady = Boolean(prisma?.bookingLinkClick && prisma?.qrScan);
  const emailReady = Boolean(process.env.RESEND_API_KEY && process.env.PIN2WIN_EMAIL_FROM);
  const results: LaunchTestResult[] = selectedLocation
    ? [
        {
          label: "Partner location selected",
          detail: `${selectedLocation.name} is active and available for testing.`,
          status: "pass",
        },
        {
          label: "Website saved",
          detail: selectedLocation.websiteUrl
            ? selectedLocation.websiteUrl
            : "Add the partner website for a complete public profile.",
          status: selectedLocation.websiteUrl ? "pass" : "warning",
        },
        bookingLinkTest,
        {
          label: "QR landing URL generated",
          detail: qrUrl || "No QR URL could be generated.",
          status: qrUrl ? "pass" : "fail",
        },
        {
          label: "Simulator event code active",
          detail: eventCode
            ? "The active challenge has a simulator event code."
            : "Set the global simulator event code before testing entries.",
          status: eventCode ? "pass" : "fail",
        },
        {
          label: "Analytics tracking ready",
          detail: trackingReady
            ? "Booking-click and QR-scan tracking models are available."
            : "Restart after migrations or check Prisma generation.",
          status: trackingReady ? "pass" : "warning",
        },
        {
          label: "Email confirmation ready",
          detail: emailReady
            ? "Resend API key and Pin2Win sender are configured."
            : "Add RESEND_API_KEY and PIN2WIN_EMAIL_FROM before production email tests.",
          status: emailReady ? "pass" : "warning",
        },
        {
          label: "Ready for manual test entry",
          detail:
            qrUrl && eventCode
              ? "Open the QR URL, create a real test account, and complete one admin-confirmed test entry."
              : "Complete the required setup above before creating a test entry.",
          status: qrUrl && eventCode ? "pass" : "fail",
        },
        {
          label: "First entry recorded",
          detail:
            entries.length > 0
              ? `${entries.length} entry record(s) exist for this partner.`
              : "No entries have been recorded for this partner yet.",
          status: entries.length > 0 ? "pass" : "warning",
        },
      ]
    : [
        {
          label: "Partner location selected",
          detail: "Add or select a partner location before running a launch test.",
          status: "fail",
        },
      ];
  const passCount = results.filter((result) => result.status === "pass").length;
  const failCount = results.filter((result) => result.status === "fail").length;
  const warningCount = results.filter(
    (result) => result.status === "warning",
  ).length;

  return (
    <AdminShell
      eyebrow="Launch testing"
      title="Partner launch test"
      description="Run a non-destructive setup test before sending a partner live."
      actions={
        <Link
          href="/admin/locations"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
        >
          Back to locations <ArrowRight size={17} />
        </Link>
      }
    >
      <section className="mt-8 rounded-lg border border-[#ded6c8] bg-white p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <FlaskConical className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">
                {selectedLocation?.name ?? "No partner selected"}
              </h2>
            </div>
            {selectedLocation ? (
              <p className="mt-3 text-sm font-bold text-[#59655f]">
                {selectedLocation.slug}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-[#eef7e9] px-4 py-3">
              <p className="text-2xl font-black text-[#2f6b3f]">{passCount}</p>
              <p className="text-xs font-black uppercase text-[#2f6b3f]">
                Pass
              </p>
            </div>
            <div className="rounded-md bg-[#fff8e8] px-4 py-3">
              <p className="text-2xl font-black text-[#8a6419]">
                {warningCount}
              </p>
              <p className="text-xs font-black uppercase text-[#8a6419]">
                Warn
              </p>
            </div>
            <div className="rounded-md bg-[#fff1f1] px-4 py-3">
              <p className="text-2xl font-black text-[#9b1c1c]">{failCount}</p>
              <p className="text-xs font-black uppercase text-[#9b1c1c]">
                Fail
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3">
        {results.map((result) => {
          const styles = getStatusStyles(result.status);
          const Icon = styles.icon;

          return (
            <div
              key={result.label}
              className={`rounded-lg border border-[#ded6c8] p-5 ${styles.bg}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 shrink-0 ${styles.text}`} size={23} />
                <div>
                  <h3 className={`font-black ${styles.text}`}>
                    {result.label}
                  </h3>
                  <p className="mt-2 break-words text-sm font-bold leading-6 text-[#59655f]">
                    {result.detail}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {qrUrl ? (
        <section className="mt-6 rounded-lg border border-[#ded6c8] bg-white p-5">
          <h2 className="text-2xl font-black">Manual test path</h2>
          <ol className="mt-5 grid gap-3 text-sm font-bold leading-6 text-[#59655f]">
            <li>1. Open the generated QR URL below.</li>
            <li>2. Create or log into a test player account.</li>
            <li>3. Verify the event code appears only after the required entry step.</li>
            <li>4. Confirm or deny the entry from the admin Review page.</li>
            <li>5. Confirm the entrant and Pin2Win notification emails arrive.</li>
          </ol>
          <a
            href={qrUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
          >
            Open QR landing <ExternalLink size={16} />
          </a>
        </section>
      ) : null}
    </AdminShell>
  );
}
