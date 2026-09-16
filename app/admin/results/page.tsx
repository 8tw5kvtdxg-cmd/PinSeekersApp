import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminResultsPage() {
  await requireAdminSession("/admin/results");
  redirect("/admin/winners");
}
