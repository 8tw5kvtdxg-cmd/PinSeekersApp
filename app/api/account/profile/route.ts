import { getCurrentPlayer, publicPlayer } from "@/lib/player-auth";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function PATCH(request: Request) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 500 },
    );
  }

  const currentPlayer = await getCurrentPlayer();

  if (!currentPlayer) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: unknown;
    phone?: unknown;
    simulatorDisplayName?: unknown;
  };
  const name = cleanText(body.name, 120);
  const phone = cleanText(body.phone, 40);
  const simulatorDisplayName = cleanText(body.simulatorDisplayName, 120);

  if (!name || !phone || !simulatorDisplayName) {
    return Response.json(
      {
        error:
          "Name, phone number, and simulator display name are required for repeat entry.",
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    data: {
      name,
      phone,
      simulatorDisplayName,
    },
    where: { id: currentPlayer.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      simulatorDisplayName: true,
      emailVerifiedAt: true,
    },
  });

  return Response.json({ user: publicPlayer(user) });
}
