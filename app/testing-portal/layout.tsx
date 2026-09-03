import type { ReactNode } from "react";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function TestingPortalLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAdminSession("/testing-portal");

  return children;
}
