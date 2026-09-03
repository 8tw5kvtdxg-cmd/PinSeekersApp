import {
  deleteSimulatorSession,
  getSimulatorSession,
  listSimulatorResults,
  updateSimulatorSession,
} from "@/lib/simulator/store";
import type {
  SimulatorSessionInput,
  SimulatorSessionStatus,
} from "@/lib/simulator/types";
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
  const session = await getSimulatorSession(pin2WinSessionId);

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json({
    session,
    results: await listSimulatorResults(pin2WinSessionId),
  });
}

export async function PATCH(request: Request, context: Context) {
  if (!(await isSimulatorRequestAuthenticated(request))) {
    return simulatorUnauthorizedResponse();
  }

  const { pin2WinSessionId } = await context.params;
  const input = (await request.json()) as Partial<SimulatorSessionInput> & {
    status?: SimulatorSessionStatus;
  };
  const session = await updateSimulatorSession(pin2WinSessionId, input);

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json({ session });
}

export async function DELETE(request: Request, context: Context) {
  if (!(await isSimulatorRequestAuthenticated(request))) {
    return simulatorUnauthorizedResponse();
  }

  const { pin2WinSessionId } = await context.params;
  const deleted = await deleteSimulatorSession(pin2WinSessionId);

  if (!deleted) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json({ deleted: true, pin2WinSessionId });
}
