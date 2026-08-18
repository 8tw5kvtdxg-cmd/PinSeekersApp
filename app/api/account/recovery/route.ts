import {
  createPasswordResetToken,
  sendAccountRecoveryEmail,
} from "@/lib/account-recovery";
import { getPrismaClient } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as {
    email?: unknown;
  };
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const neutralMessage =
    "If an account exists for that email, recovery instructions have been sent.";

  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  if (!user) {
    return Response.json({ message: neutralMessage });
  }

  try {
    const token = await createPasswordResetToken(user.id);

    await sendAccountRecoveryEmail({
      email: user.email,
      username: user.username,
      token,
      request,
    });
  } catch (error) {
    console.error("Could not send account recovery email.", error);

    return Response.json(
      { error: "Recovery email could not be sent." },
      { status: 500 },
    );
  }

  return Response.json({ message: neutralMessage });
}
