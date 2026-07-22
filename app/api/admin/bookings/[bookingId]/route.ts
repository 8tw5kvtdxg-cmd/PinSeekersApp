import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import {
  type BookingVerificationStatus,
  updateBookingVerificationStatus,
} from "@/lib/booking-verification-store";

export const dynamic = "force-dynamic";

const allowedStatuses: BookingVerificationStatus[] = [
  "Pending Match",
  "Auto Verified",
  "Needs Review",
  "Used",
  "Rejected",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  if (!isAdminRequestAuthenticated(request)) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const { bookingId } = await params;
  const body = (await request.json()) as {
    status?: unknown;
    matchedEntryId?: unknown;
  };

  if (
    typeof body.status !== "string" ||
    !allowedStatuses.includes(body.status as BookingVerificationStatus)
  ) {
    return Response.json({ error: "Valid status is required." }, { status: 400 });
  }

  try {
    const booking = await updateBookingVerificationStatus({
      bookingId,
      status: body.status as BookingVerificationStatus,
      matchedEntryId:
        typeof body.matchedEntryId === "string" ? body.matchedEntryId : "",
    });

    return Response.json({ booking });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update booking.",
      },
      { status: 400 },
    );
  }
}
