const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizeOrigin(value: string | undefined | null) {
  if (!value) return "";

  try {
    return new URL(value.includes("://") ? value : `https://${value}`).origin;
  } catch {
    return "";
  }
}

function allowedOrigins(request: Request) {
  const origins = new Set<string>();
  const requestOrigin = normalizeOrigin(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";

  if (requestOrigin) origins.add(requestOrigin);
  if (forwardedHost) origins.add(normalizeOrigin(`${forwardedProto}://${forwardedHost}`));

  [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.PIN2WIN_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ].forEach((value) => {
    const origin = normalizeOrigin(value);
    if (origin) origins.add(origin);
  });

  origins.delete("");
  return origins;
}

export function isSameOriginRequest(request: Request) {
  if (!unsafeMethods.has(request.method.toUpperCase())) return true;

  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") return false;

  const origin = normalizeOrigin(request.headers.get("origin"));
  if (!origin) return true;

  return allowedOrigins(request).has(origin);
}

export function rejectCrossSiteRequest(request: Request) {
  if (isSameOriginRequest(request)) return null;

  return Response.json(
    { error: "Cross-site request rejected." },
    { status: 403 },
  );
}
