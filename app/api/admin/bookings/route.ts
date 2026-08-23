import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import {
  createBookingVerificationRecord,
  listBookingVerificationRecords,
} from "@/lib/booking-verification-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const bookings = await listBookingVerificationRecords();

  return Response.json({ bookings });
}

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    customerName?: unknown;
    customerEmail?: unknown;
    customerPhone?: unknown;
    locationSlug?: unknown;
    locationName?: unknown;
    bayName?: unknown;
    productName?: unknown;
    reservationStartsAt?: unknown;
    reservationEndsAt?: unknown;
    amountCents?: unknown;
    source?: unknown;
    externalReference?: unknown;
    rawEmailSubject?: unknown;
    rawEmailText?: unknown;
  };

  try {
    const booking = await createBookingVerificationRecord({
      customerName:
        typeof body.customerName === "string" ? body.customerName : "",
      customerEmail:
        typeof body.customerEmail === "string" ? body.customerEmail : "",
      customerPhone:
        typeof body.customerPhone === "string" ? body.customerPhone : "",
      locationSlug:
        typeof body.locationSlug === "string" ? body.locationSlug : "",
      locationName:
        typeof body.locationName === "string" ? body.locationName : "",
      bayName: typeof body.bayName === "string" ? body.bayName : "",
      productName:
        typeof body.productName === "string" ? body.productName : "",
      reservationStartsAt:
        typeof body.reservationStartsAt === "string"
          ? body.reservationStartsAt
          : "",
      reservationEndsAt:
        typeof body.reservationEndsAt === "string"
          ? body.reservationEndsAt
          : "",
      amountCents:
        typeof body.amountCents === "number" &&
        Number.isFinite(body.amountCents)
          ? body.amountCents
          : undefined,
      source: body.source === "Email CC" || body.source === "Import" ? body.source : "Manual",
      externalReference:
        typeof body.externalReference === "string"
          ? body.externalReference
          : "",
      rawEmailSubject:
        typeof body.rawEmailSubject === "string" ? body.rawEmailSubject : "",
      rawEmailText:
        typeof body.rawEmailText === "string" ? body.rawEmailText : "",
    });

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create booking verification.",
      },
      { status: 400 },
    );
  }
}
