import { getCurrentPlayer, publicPlayer } from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentPlayer();

  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({ user: publicPlayer(user) });
}
