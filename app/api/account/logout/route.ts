import { cookies } from "next/headers";
import { adminSessionCookieName } from "@/lib/admin-auth";
import {
  deletePlayerSession,
  playerSessionCookieName,
} from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  await deletePlayerSession(cookieStore.get(playerSessionCookieName)?.value);

  cookieStore.set({
    name: playerSessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set({
    name: adminSessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return Response.json({ ok: true });
}
