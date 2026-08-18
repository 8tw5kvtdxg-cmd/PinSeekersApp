import { getPrismaClient } from "@/lib/prisma";

export type PartnerLocationSummary = {
  id: string;
  name: string;
  slug: string;
  bookingUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
};

const builtInPartnerLocations: PartnerLocationSummary[] = [
  {
    id: "existing-alamo-golf-den",
    name: "Alamo Golf Den",
    slug: "alamo-golf-den",
    bookingUrl: "https://alamogolfden.golf918.net/embed/y1snhpyhqamwoh5xo4lml",
    websiteUrl: "https://alamogolfden.com",
    isActive: true,
  },
];

export async function listPartnerLocations() {
  const prisma = getPrismaClient();
  const dbLocations = prisma
    ? await prisma.location.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          bookingUrl: true,
          websiteUrl: true,
          isActive: true,
        },
        where: {
          isActive: true,
        },
      })
    : [];

  return [
    ...builtInPartnerLocations,
    ...dbLocations.filter(
      (location) =>
        !builtInPartnerLocations.some(
          (builtInLocation) => builtInLocation.slug === location.slug,
        ),
    ),
  ];
}
