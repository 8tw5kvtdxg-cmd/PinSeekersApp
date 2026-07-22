export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json(
    {
      error:
        "Payment webhooks are disabled. Pin2Win now records venue-paid entries through the QR registration flow.",
    },
    { status: 410 },
  );
}
