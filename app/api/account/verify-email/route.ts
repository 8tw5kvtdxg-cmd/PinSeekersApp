import { redirect } from "next/navigation";
import { verifyEmailToken } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";

  if (!token) {
    redirect("/account?verification=missing#login");
  }

  const result = await verifyEmailToken(token);

  if (!result.ok) {
    redirect("/account?verification=failed#login");
  }

  redirect("/account?verification=success#login");
}
