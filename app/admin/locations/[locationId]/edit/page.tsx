import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPortalNav } from "@/app/admin/admin-shell";
import { AdminHomeLink } from "@/app/admin/admin-home-link";
import { LocationForm } from "@/app/admin/locations/new/location-form";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export default async function EditAdminLocationPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  await requireAdminSession("/admin/locations");
  const { locationId } = await params;
  const prisma = getPrismaClient();

  if (!prisma) {
    notFound();
  }

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      bays: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!location) {
    notFound();
  }

  const simulatorSoftwareOptions = (
    await prisma.location.findMany({
      distinct: ["simulatorSoftwareName"],
      orderBy: { simulatorSoftwareName: "asc" },
      select: { simulatorSoftwareName: true },
      where: { simulatorSoftwareName: { not: null } },
    })
  )
    .map((savedLocation) => savedLocation.simulatorSoftwareName)
    .filter((name): name is string => Boolean(name));

  return (
    <main className="min-h-screen bg-[#f8f4ec] text-[#18211f]">
      <AdminPortalNav />
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
          Partner locations
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <AdminHomeLink />
          <Link
            href="/admin/locations"
            className="inline-flex h-12 items-center justify-center rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
          >
            Locations
          </Link>
        </div>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">
          Edit {location.name}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#53605a]">
          Update partner details, website, and bay labels used for QR code
          generation.
        </p>

        <LocationForm
          mode="edit"
          locationId={location.id}
          simulatorSoftwareOptions={simulatorSoftwareOptions}
          initialValues={{
            name: location.name,
            slug: location.slug,
            address: location.address ?? "",
            city: location.city ?? "",
            state: location.state ?? "",
            websiteUrl: location.websiteUrl ?? "",
            simulatorProvider: location.simulatorProvider,
            simulatorSoftwareName: location.simulatorSoftwareName ?? "",
            bays: location.bays.map((bay) => bay.name),
          }}
        />
      </div>
    </main>
  );
}
