import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";
import { AlamoBayStatus, alamoPreviewPath } from "@/app/admin/alamo-bay-status";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminEntryPreviewPage() {
  await requireAdminSession(alamoPreviewPath);

  return (
    <AdminShell
      title="Customer entry preview"
      description="Check where the Alamo poster should lead and see which settings could stop checkout."
      actions={<Link href="/admin" className="rounded-md border border-[#ded6c8] bg-white px-4 py-2 text-sm font-bold">Back to Today</Link>}
    >
      <AlamoBayStatus preview />
    </AdminShell>
  );
}
