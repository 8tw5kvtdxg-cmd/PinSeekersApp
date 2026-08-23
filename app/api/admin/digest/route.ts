import { getAdminDigest } from "@/lib/admin-digest";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function isAuthorized(request: Request) {
  const digestSecret =
    process.env.ZAPIER_ADMIN_DIGEST_SECRET ??
    process.env.BOOKING_EMAIL_INTAKE_SECRET;

  if (await isAdminRequestAuthenticated(request)) {
    return true;
  }

  if (!digestSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization") ?? "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const headerToken = request.headers.get("x-pin2win-digest-secret") ?? "";

  return bearerToken === digestSecret || headerToken === digestSecret;
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = Math.min(
    Math.max(Number(url.searchParams.get("days") ?? "1") || 1, 1),
    30,
  );
  const digest = await getAdminDigest(days);

  return Response.json(digest);
}
