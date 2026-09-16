import { timingSafeEqual } from "node:crypto";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function isSimulatorRequestAuthenticated(request: Request) {
  if (isSimulatorApiSecretAuthenticated(request)) return true;
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.startsWith("Bearer ") || request.headers.get("x-pin2win-simulator-secret")) return false;

  const { isAdminRequestAuthenticated } = await import("./admin-auth.ts");

  return isAdminRequestAuthenticated(request);
}

export function isSimulatorApiSecretAuthenticated(request: Request) {
  const expectedSecret = process.env.PIN2WIN_SIMULATOR_API_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const headerToken =
    request.headers.get("x-pin2win-simulator-secret")?.trim() ?? "";
  const suppliedSecret = bearerToken || headerToken;

  return Boolean(suppliedSecret && expectedSecret && safeEqual(suppliedSecret, expectedSecret));
}

export function simulatorUnauthorizedResponse() {
  return Response.json(
    { error: "Admin login or simulator API authorization required." },
    { status: 401 },
  );
}
