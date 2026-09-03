import {
  createSimulatorSession,
  listSimulatorResults,
  listSimulatorSessions,
} from "@/lib/simulator/store";
import type { SimulatorSessionInput } from "@/lib/simulator/types";
import {
  isSimulatorRequestAuthenticated,
  simulatorUnauthorizedResponse,
} from "@/lib/simulator-auth";

export async function GET(request: Request) {
  if (!(await isSimulatorRequestAuthenticated(request))) {
    return simulatorUnauthorizedResponse();
  }

  return Response.json({
    sessions: await listSimulatorSessions(),
    results: await listSimulatorResults(),
  });
}

export async function POST(request: Request) {
  if (!(await isSimulatorRequestAuthenticated(request))) {
    return simulatorUnauthorizedResponse();
  }

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
