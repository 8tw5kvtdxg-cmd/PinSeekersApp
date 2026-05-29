import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import { clubhouseChallenges } from "@/lib/clubhouse";
import { getPrismaClient } from "@/lib/prisma";
import {
  getAppOrigin,
  getQrEntryUrl,
  slugifyLocation,
} from "@/lib/location-utils";

export const dynamic = "force-dynamic";

async function parseLocationBody(request: Request) {
  const body = (await request.json()) as {
    locationId?: unknown;
    name?: unknown;
    slug?: unknown;
    address?: unknown;
    city?: unknown;
    state?: unknown;
    websiteUrl?: unknown;
    bays?: unknown;
  };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slugInput = typeof body.slug === "string" ? body.slug.trim() : "";
  const slug = slugifyLocation(slugInput || name);
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state = typeof body.state === "string" ? body.state.trim() : "";
  const rawWebsiteUrl =
    typeof body.websiteUrl === "string" ? body.websiteUrl.trim() : "";
  const websiteUrl =
    rawWebsiteUrl && !rawWebsiteUrl.startsWith("http")
      ? `https://${rawWebsiteUrl}`
      : rawWebsiteUrl;
  const bayNames = Array.isArray(body.bays)
    ? body.bays
        .filter((bay): bay is string => typeof bay === "string")
        .map((bay) => bay.trim())
        .filter(Boolean)
    : [];

  return {
    locationId:
      typeof body.locationId === "string" ? body.locationId.trim() : "",
    name,
    slug,
    address,
    city,
    state,
    websiteUrl,
    bayNames,
  };
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthenticated(request)) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 500 },
    );
  }

  const { name, slug, address, city, state, websiteUrl, bayNames } =
    await parseLocationBody(request);

  if (!name || !slug) {
    return Response.json(
      { error: "Location name is required." },
      { status: 400 },
    );
  }

  const uniqueBayNames = Array.from(new Set(bayNames));
  const origin = getAppOrigin(request);

  try {
    const location = await prisma.location.create({
      data: {
        name,
        slug,
        address: address || null,
        city: city || null,
        state: state || null,
        websiteUrl: websiteUrl || null,
        bays: {
          create: uniqueBayNames.map((bayName) => ({
            name: bayName,
            qrCodeUrl: getQrEntryUrl({
              origin,
              challengeSlug: clubhouseChallenges[0].slug,
              locationSlug: slug,
              bayName,
            }),
          })),
        },
      },
      include: { bays: true },
    });

    return Response.json({ location }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error && error.message.includes("Unique constraint")
            ? "A location with that slug already exists."
            : "Could not create location.",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequestAuthenticated(request)) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 500 },
    );
  }

  const {
    locationId,
    name,
    slug,
    address,
    city,
    state,
    websiteUrl,
    bayNames,
  } = await parseLocationBody(request);

  if (!locationId || !name || !slug) {
    return Response.json(
      { error: "Location ID, name, and slug are required." },
      { status: 400 },
    );
  }

  const uniqueBayNames = Array.from(new Set(bayNames));
  const origin = getAppOrigin(request);

  try {
    const location = await prisma.$transaction(async (transaction) => {
      const updatedLocation = await transaction.location.update({
        where: { id: locationId },
        data: {
          name,
          slug,
          address: address || null,
          city: city || null,
          state: state || null,
          websiteUrl: websiteUrl || null,
        },
      });

      await transaction.bay.updateMany({
        where: {
          locationId,
          name: { notIn: uniqueBayNames },
        },
        data: {
          isActive: false,
        },
      });

      await Promise.all(
        uniqueBayNames.map((bayName) =>
          transaction.bay.upsert({
            where: {
              locationId_name: {
                locationId,
                name: bayName,
              },
            },
            update: {
              isActive: true,
              qrCodeUrl: getQrEntryUrl({
                origin,
                challengeSlug: clubhouseChallenges[0].slug,
                locationSlug: slug,
                bayName,
              }),
            },
            create: {
              locationId,
              name: bayName,
              isActive: true,
              qrCodeUrl: getQrEntryUrl({
                origin,
                challengeSlug: clubhouseChallenges[0].slug,
                locationSlug: slug,
                bayName,
              }),
            },
          }),
        ),
      );

      return transaction.location.findUniqueOrThrow({
        where: { id: updatedLocation.id },
        include: {
          bays: {
            where: { isActive: true },
            orderBy: { name: "asc" },
          },
        },
      });
    });

    return Response.json({ location });
  } catch (error) {
    console.error("Could not update location", error);

    return Response.json(
      {
        error:
          error instanceof Error && error.message.includes("Unique constraint")
            ? "A location with that slug already exists."
            : "Could not update location.",
      },
      { status: 400 },
    );
  }
}
