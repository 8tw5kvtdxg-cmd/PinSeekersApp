import { cookies } from "next/headers";
import { validateEmailForSignup } from "@/lib/email-verification";
import { validateAccountCreationConsent } from "@/lib/legal-documents";
import { getPrismaClient } from "@/lib/prisma";
import { consumeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/request-security";
import {
  createPlayerSession,
  hashPassword,
  normalizeEmail,
  normalizeUsername,
  playerSessionDurationSeconds,
  playerSessionCookieName,
  publicPlayer,
} from "@/lib/player-auth";

export const dynamic = "force-dynamic";

function isPrismaUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function usernameSeedFrom(value: string) {
  const seed = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return seed || `player-${Date.now()}`;
}

async function resolveAvailableUsername(input: {
  prisma: NonNullable<ReturnType<typeof getPrismaClient>>;
  requestedUsername: string;
  email: string;
  simulatorDisplayName: string;
}) {
  if (input.requestedUsername) {
    const existingUsername = await input.prisma.user.findUnique({
      where: { username: input.requestedUsername },
      select: { id: true },
    });

    if (existingUsername) {
      throw new Error("That username is already taken.");
    }

    return input.requestedUsername;
  }

  const emailLocalPart = input.email.split("@")[0] ?? "";
  const baseUsername = usernameSeedFrom(
    input.simulatorDisplayName || emailLocalPart,
  ).slice(0, 40);

  for (let index = 0; index < 50; index += 1) {
    const username =
      index === 0 ? baseUsername : `${baseUsername}-${index + 1}`;
    const existingUsername = await input.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existingUsername) {
      return username;
    }
  }

  return `${baseUsername}-${Date.now()}`;
}

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const rateLimit = await consumeRateLimit({
    namespace: "account-signup",
    identifier: getClientIp(request),
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const prisma = getPrismaClient();

  if (!prisma) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as {
    username?: unknown;
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    simulatorDisplayName?: unknown;
    password?: unknown;
    legalDocumentsAccepted?: unknown;
    age18Accepted?: unknown;
    texasResidencyAccepted?: unknown;
  };
  const requestedUsername =
    typeof body.username === "string" ? normalizeUsername(body.username) : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const simulatorDisplayName =
    typeof body.simulatorDisplayName === "string"
      ? body.simulatorDisplayName.trim()
      : requestedUsername;
  const password = typeof body.password === "string" ? body.password : "";

  if (
    !name ||
    !email ||
    !phone ||
    !simulatorDisplayName ||
    password.length < 8
  ) {
    return Response.json(
      {
        error:
          "Name, phone, E6 Golf username, email, and an 8+ character password are required.",
      },
      { status: 400 },
    );
  }

  let legalSnapshot: ReturnType<typeof validateAccountCreationConsent>;

  try {
    legalSnapshot = validateAccountCreationConsent({
      legalDocumentsAccepted: body.legalDocumentsAccepted,
      age18Accepted: body.age18Accepted,
      texasResidencyAccepted: body.texasResidencyAccepted,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The required agreements must be accepted.",
      },
      { status: 400 },
    );
  }

  try {
    const emailValidationError = await validateEmailForSignup(email);

    if (emailValidationError) {
      return Response.json({ error: emailValidationError }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
      },
    });

    if (existingEmail) {
      return Response.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const username = await resolveAvailableUsername({
      email,
      prisma,
      requestedUsername,
      simulatorDisplayName,
    });

    const acceptedAt = new Date();
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name,
          username,
          email,
          phone,
          simulatorDisplayName,
          emailVerifiedAt: new Date(),
          passwordHash: hashPassword(password),
        },
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

      await transaction.accountConsentRecord.create({
        data: {
          userId: createdUser.id,
          documentVersion: legalSnapshot.documentVersion,
          acceptanceText: {
            legalDocuments: legalSnapshot.acceptanceText.legalDocuments,
            age18: legalSnapshot.acceptanceText.age18,
            texasResidency: legalSnapshot.acceptanceText.texasResidency,
          },
          documentHashes: legalSnapshot.documentHashes,
          combinedDocumentHash: legalSnapshot.combinedDocumentHash,
          legalDocumentsAccepted: true,
          age18Accepted: true,
          texasResidencyAccepted: true,
          acceptedAt,
          ipAddress:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip")?.trim() ||
            undefined,
          userAgent: request.headers.get("user-agent")?.trim() || undefined,
        },
      });

      return createdUser;
    });
    const cookieStore = await cookies();
    const playerSessionToken = await createPlayerSession(user.id);

    cookieStore.set({
      name: playerSessionCookieName,
      value: playerSessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: playerSessionDurationSeconds,
    });

    return Response.json(
      {
        user: publicPlayer(user),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Could not create account.", error);

    return Response.json(
      {
        error:
          error instanceof Error && error.message === "That username is already taken."
            ? error.message
            : isPrismaUniqueConstraintError(error)
          ? "An account with that email or username already exists."
          : "Could not create account.",
      },
      { status: 400 },
    );
  }
}
