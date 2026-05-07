import {
  createSimulatorSession,
  listSimulatorResults,
  listSimulatorSessions,
} from "@/lib/simulator/store";
import type { SimulatorSessionInput } from "@/lib/simulator/types";

export async function GET() {
  return Response.json({
    sessions: await listSimulatorSessions(),
    results: await listSimulatorResults(),
  });
}

export async function POST(request: Request) {
  const input = (await request.json()) as SimulatorSessionInput;

  if (!input.challengeType) {
    return Response.json(
      { error: "challengeType is required" },
      { status: 400 },
    );
  }

  const session = await createSimulatorSession(input);

  return Response.json({ session }, { status: 201 });
}
