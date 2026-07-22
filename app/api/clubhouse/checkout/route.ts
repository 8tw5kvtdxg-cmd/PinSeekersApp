export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json(
    {
      error:
        "Checkout is disabled. Book through Alamo Golf Den, then scan the onsite QR code and confirm the matched booking.",
    },
    { status: 410 },
  );
}
