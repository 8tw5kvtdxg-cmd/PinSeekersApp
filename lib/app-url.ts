export function getAppBaseUrl(request?: Request) {
  if (request && process.env.NODE_ENV !== "production") {
    return new URL(request.url).origin;
  }

  const configuredUrl =
    process.env.PIN2WIN_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL;

  if (configuredUrl) {
    const normalizedUrl = configuredUrl.replace(/^["']|["']$/g, "");

    return normalizedUrl.startsWith("http")
      ? normalizedUrl
      : `https://${normalizedUrl}`;
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
}
