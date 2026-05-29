import { AdminHomeLink } from "@/app/admin/admin-home-link";
import { LocationForm } from "@/app/admin/locations/new/location-form";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function NewAdminLocationPage() {
  await requireAdminSession("/admin/locations/new");

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
          Create location
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#53605a]">
          Add a partner venue and bay labels. Pin2Win will generate location
          specific QR entry links for every active challenge.
        </p>

        <LocationForm />
      </div>
    </main>
  );
}
