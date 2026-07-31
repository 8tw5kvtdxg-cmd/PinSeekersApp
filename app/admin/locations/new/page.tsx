import { AdminHomeLink } from "@/app/admin/admin-home-link";
import { LocationForm } from "@/app/admin/locations/new/location-form";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export default async function NewAdminLocationPage() {
  await requireAdminSession("/admin/locations/new");
  const prisma = getPrismaClient();
  const simulatorSoftwareOptions = prisma
    ? (
        await prisma.location.findMany({
          distinct: ["simulatorSoftwareName"],
          orderBy: { simulatorSoftwareName: "asc" },
          select: { simulatorSoftwareName: true },
          where: { simulatorSoftwareName: { not: null } },
        })
      )
        .map((location) => location.simulatorSoftwareName)
        .filter((name): name is string => Boolean(name))
    : [];

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
          Partner locations
        </p>
        <div className="mt-6">
          <AdminHomeLink />
        </div>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">
          Add new partner
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#53605a]">
          Add a partner venue, simulator type, and bay labels. Pin2Win will
          generate location-specific QR entry links for every active challenge.
        </p>

        <LocationForm simulatorSoftwareOptions={simulatorSoftwareOptions} />
      </div>
    </main>
  );
}
