export function slugifyLocation(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getAppOrigin(request?: Request) {
  const configuredUrl =
    process.env.PIN2WIN_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL;

  if (configuredUrl) {
    return configuredUrl.startsWith("http")
      ? configuredUrl
      : `https://${configuredUrl}`;
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
}

export function getQrEntryUrl(input: {
  origin?: string;
  challengeSlug: string;
  locationSlug: string;
  bayName?: string | null;
}) {
  const url = new URL(
    `/play/${input.challengeSlug}`,
    input.origin ?? getAppOrigin(),
  );

  url.searchParams.set("location", input.locationSlug);

  if (input.bayName) {
    url.searchParams.set("bay", input.bayName);
  }

  return url.toString();
}

export function getQrImageUrl(data: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
