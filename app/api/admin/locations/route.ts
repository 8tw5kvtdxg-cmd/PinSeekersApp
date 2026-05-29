import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import { clubhouseChallenges } from "@/lib/clubhouse";
import { getPrismaClient } from "@/lib/prisma";
import {
  getAppOrigin,
  getQrEntryUrl,
  slugifyLocation,
} from "@/lib/location-utils";

export const dynamic = "force-dynamic";

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

  const body = (await request.json()) as {
    name?: unknown;
    slug?: unknown;
    address?: unknown;
    city?: unknown;
    state?: unknown;
    bays?: unknown;
  };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slugInput = typeof body.slug === "string" ? body.slug.trim() : "";
  const slug = slugifyLocation(slugInput || name);
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state = typeof body.state === "string" ? body.state.trim() : "";
  const bayNames = Array.isArray(body.bays)
    ? body.bays
        .filter((bay): bay is string => typeof bay === "string")
        .map((bay) => bay.trim())
        .filter(Boolean)
    : [];

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
