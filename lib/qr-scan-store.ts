import { headers } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { slugifyLocation } from "@/lib/location-utils";

function cleanText(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function recordQrScan(input: {
  bayName?: string;
  bookingMatchStatus?: "Matched" | "No Match";
  bookingVerificationId?: string;
  challengeSlug: string;
  locationSlug?: string;
}) {
  const locationSlug = slugifyLocation(input.locationSlug ?? "");

  if (!locationSlug) {
    return null;
  }

  const prisma = getPrismaClient();

  if (!prisma?.qrScan) {
    return null;
  }

  const requestHeaders = await headers();

  return prisma.qrScan.create({
    data: {
      challengeSlug: input.challengeSlug,
      locationSlug,
      bayName: cleanText(input.bayName, 180) || null,
      bookingMatchStatus: input.bookingMatchStatus ?? null,
      bookingVerificationId: cleanText(input.bookingVerificationId, 180) || null,
      referrer: cleanText(requestHeaders.get("referer"), 1000) || null,
      userAgent: cleanText(requestHeaders.get("user-agent"), 500) || null,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });
}
