import { cookies } from "next/headers";
import {
  getActivePlayerSession,
  playerSessionCookieName,
  playerSessionDurationSeconds,
} from "@/lib/player-auth";
import { rejectCrossSiteRequest } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const session = await getActivePlayerSession(
    cookieStore.get(playerSessionCookieName)?.value,
    { touch: false },
  );

  return Response.json(
    { active: Boolean(session) },
    { status: session ? 200 : 401 },
  );
}

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const cookieStore = await cookies();
  const token = cookieStore.get(playerSessionCookieName)?.value;
  const session = await getActivePlayerSession(token);

  if (!session || !token) {
    cookieStore.set({
      name: playerSessionCookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return Response.json({ active: false }, { status: 401 });
  }

  cookieStore.set({
    name: playerSessionCookieName,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: playerSessionDurationSeconds,
  });

  return Response.json({ active: true });
}
