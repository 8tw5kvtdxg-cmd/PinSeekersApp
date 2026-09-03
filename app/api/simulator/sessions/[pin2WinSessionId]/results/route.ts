import {
  createSimulatorResult,
  listSimulatorResults,
} from "@/lib/simulator/store";
import type { SimulatorResultInput } from "@/lib/simulator/types";
import {
  isSimulatorRequestAuthenticated,
  simulatorUnauthorizedResponse,
} from "@/lib/simulator-auth";

type Context = {
  params: Promise<{ pin2WinSessionId: string }>;
};

export async function GET(request: Request, context: Context) {
  if (!(await isSimulatorRequestAuthenticated(request))) {
    return simulatorUnauthorizedResponse();
  }

  const { pin2WinSessionId } = await context.params;

  return Response.json({
    results: await listSimulatorResults(pin2WinSessionId),
  });
}

export async function POST(request: Request, context: Context) {
  if (!(await isSimulatorRequestAuthenticated(request))) {
    return simulatorUnauthorizedResponse();
  }

  const { pin2WinSessionId } = await context.params;
  const input = (await request.json()) as SimulatorResultInput;

  if (!input.rawResult) {
    return Response.json({ error: "rawResult is required" }, { status: 400 });
  }

  const result = await createSimulatorResult(pin2WinSessionId, input);

  if (!result) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json({ result }, { status: 201 });
}
