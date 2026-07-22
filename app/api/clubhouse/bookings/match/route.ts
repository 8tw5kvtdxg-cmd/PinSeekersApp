import {
  findLikelyBookingMatch,
  toPublicBookingMatch,
} from "@/lib/booking-verification-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locationSlug = url.searchParams.get("location") ?? "";
  const bayName = url.searchParams.get("bay") ?? "";
  const email = url.searchParams.get("email") ?? "";
  const booking = await findLikelyBookingMatch({
    locationSlug,
    bayName,
    email,
  });

  return Response.json({
    booking: booking ? toPublicBookingMatch(booking) : null,
  });
}
