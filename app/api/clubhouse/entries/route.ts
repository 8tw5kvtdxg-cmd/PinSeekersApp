import {
  createClubhouseEntryRecord,
  listClubhouseEntryRecords,
} from "@/lib/clubhouse-entry-store";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import { getBookingVerificationRecord } from "@/lib/booking-verification-store";
import { getCurrentVerifiedPlayer, normalizeEmail } from "@/lib/player-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const entries = await listClubhouseEntryRecords();

  return Response.json({ entries });
}

export async function POST(request: Request) {
  const { player, error, status } = await getCurrentVerifiedPlayer();

  if (error) {
    return Response.json({ error }, { status });
  }

  const body = (await request.json()) as {
    challengeSlug?: unknown;
    playerName?: unknown;
    phoneNumber?: unknown;
    e6DisplayName?: unknown;
    venueBookingReference?: unknown;
    bookingVerificationId?: unknown;
    locationSlug?: unknown;
    bayName?: unknown;
  };
  const venueBookingReference =
    typeof body.venueBookingReference === "string"
      ? body.venueBookingReference.trim()
      : "";
  const bookingVerificationId =
    typeof body.bookingVerificationId === "string"
      ? body.bookingVerificationId.trim()
      : "";

  if (!bookingVerificationId) {
    return Response.json(
      { error: "A matched Alamo booking must be confirmed before the E6 code unlocks." },
      { status: 400 },
    );
  }

  if (bookingVerificationId) {
    const booking = await getBookingVerificationRecord(bookingVerificationId);

    if (!booking) {
      return Response.json({ error: "Booking match was not found." }, { status: 400 });
    }

    if (
      player?.email &&
      normalizeEmail(player.email) !== normalizeEmail(booking.customerEmail)
    ) {
      return Response.json(
        { error: "Login with the same email used for the Alamo booking." },
        { status: 403 },
      );
    }
  }

  try {
    const entry = await createClubhouseEntryRecord({
      challengeSlug:
        typeof body.challengeSlug === "string" ? body.challengeSlug : "",
      playerName: typeof body.playerName === "string" ? body.playerName : "",
      phoneNumber: typeof body.phoneNumber === "string" ? body.phoneNumber : "",
      e6DisplayName:
        typeof body.e6DisplayName === "string" ? body.e6DisplayName : "",
      venueBookingReference:
        venueBookingReference ||
        `Verified Alamo booking matched to ${player?.email ?? "player"}`,
      bookingVerificationId,
      locationSlug:
        typeof body.locationSlug === "string" ? body.locationSlug : "",
      bayName: typeof body.bayName === "string" ? body.bayName : "",
    });

    return Response.json({ entry }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not create entry." },
      { status: 400 },
    );
  }
}
