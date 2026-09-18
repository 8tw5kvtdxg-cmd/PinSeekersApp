import {
  createEmailVerificationToken,
  sendEmailVerification,
} from "@/lib/email-verification";
import { getCurrentPlayer } from "@/lib/player-auth";
import { consumeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const rateLimit = await consumeRateLimit({
    namespace: "verification-resend",
    identifier: getClientIp(request),
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const user = await getCurrentPlayer();

  if (!user) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  if (user.emailVerifiedAt) {
    return Response.json({ sent: false, alreadyVerified: true });
  }

  const accountLimit = await consumeRateLimit({ namespace: "verification-resend-account", identifier: user.id, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!accountLimit.allowed) return rateLimitResponse(accountLimit);
  try {
    const body = await request.json().catch(() => ({}));
    const token = await createEmailVerificationToken({
      userId: user.id,
      returnTo: body.next,
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
