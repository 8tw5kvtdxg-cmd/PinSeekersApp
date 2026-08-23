import { AdminShell } from "@/app/admin/admin-shell";
import { OperatingCostsConsole } from "@/app/admin/costs/operating-costs-console";
import { requireAdminSession } from "@/lib/admin-auth";
import { listOperatingCosts } from "@/lib/operating-cost-store";

export const dynamic = "force-dynamic";

export default async function AdminCostsPage() {
  await requireAdminSession("/admin/costs");

  const costs = await listOperatingCosts();

  return (
    <AdminShell
      eyebrow="Accounting"
      title="Operating costs"
      description="Track Pin2Win operating expenses, deductible status, payment method, and business account details."
    >
      <OperatingCostsConsole initialCosts={costs} />
    </AdminShell>
  );
}
