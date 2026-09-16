import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  adminSessionCookieName,
  deleteAdminSession,
} from "@/lib/admin-auth";
import { rejectCrossSiteRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const cookieStore = await cookies();
  await deleteAdminSession(cookieStore.get(adminSessionCookieName)?.value);
  const response = NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
  });

  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
