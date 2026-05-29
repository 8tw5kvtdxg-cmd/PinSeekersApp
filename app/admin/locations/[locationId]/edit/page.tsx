import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-5xl">
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
          initialValues={{
            name: location.name,
            slug: location.slug,
            address: location.address ?? "",
            city: location.city ?? "",
            state: location.state ?? "",
            websiteUrl: location.websiteUrl ?? "",
            bays: location.bays.map((bay) => bay.name),
          }}
        />
      </div>
    </main>
  );
}
