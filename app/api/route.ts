export async function GET() {
  return Response.json({
    name: "Pin2Win API",
    status: "poc",
    flow: [
      "scan_qr_code",
      "select_challenge",
      "create_profile",
      "pay_entry_fee",
      "create_entry",
      "admin_starts_simulator",
      "manual_result_entry",
      "leaderboard_update",
    ],
  });
}
