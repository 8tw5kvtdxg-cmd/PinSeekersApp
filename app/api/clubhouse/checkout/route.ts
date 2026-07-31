export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json(
    {
      error:
        "Legacy checkout is disabled. Use the active Pin2Win QR checkout flow.",
    },
    { status: 410 },
  );
}
