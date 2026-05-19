import { NextResponse } from "next/server";
import {
  adminSessionCookieName,
  createAdminSessionValue,
  validateAdminCredentials,
} from "@/lib/admin-auth";

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/admin")) {
    return "/admin/challenges";
  }

  if (value.startsWith("/admin/login")) {
    return "/admin/challenges";
  }

  return value;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
  const nextPath = getSafeNextPath(formData.get("next"));
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", nextPath);

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !validateAdminCredentials(username, password)
  ) {
    loginUrl.searchParams.set("error", "1");

    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), {
    status: 303,
  });
  response.cookies.set({
    name: adminSessionCookieName,
    value: createAdminSessionValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

