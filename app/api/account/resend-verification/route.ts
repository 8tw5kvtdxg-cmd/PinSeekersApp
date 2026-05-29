import {
  createEmailVerificationToken,
  sendEmailVerification,
} from "@/lib/email-verification";
import { getCurrentPlayer } from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentPlayer();

  if (!user) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  if (user.emailVerifiedAt) {
    return Response.json({ sent: false, alreadyVerified: true });
  }

  try {
    const token = await createEmailVerificationToken({
      userId: user.id,
      email: user.email,
    });

    await sendEmailVerification({
      email: user.email,
      username: user.username,
      token,
      request,
    });

    return Response.json({ sent: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Verification email could not be sent.",
      },
      { status: 500 },
    );
  }
}
