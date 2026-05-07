import type {
  SimulatorChallengeType,
  SimulatorResult,
  SimulatorResultInput,
  SimulatorSession,
  SimulatorSessionInput,
  SimulatorSessionStatus,
} from "@/lib/simulator/types";
import { getPrismaClient } from "@/lib/prisma";
import type {
  Prisma,
  SimulatorResult as PrismaSimulatorResult,
  SimulatorSession as PrismaSimulatorSession,
} from "@/app/generated/prisma/client";

type Store = {
  sessions: Map<string, SimulatorSession>;
  results: Map<string, SimulatorResult[]>;
  sequence: number;
};

const globalStore = globalThis as typeof globalThis & {
  pin2WinSimulatorStore?: Store;
};

const store =
  globalStore.pin2WinSimulatorStore ??
  (globalStore.pin2WinSimulatorStore = {
    sessions: new Map<string, SimulatorSession>(),
    results: new Map<string, SimulatorResult[]>(),
    sequence: 1,
  });

function sessionId(sequence: number) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `P2W-TEST-${date}-${String(sequence).padStart(4, "0")}`;
}

function normalizeResult(rawResult: string) {
  const value = Number.parseFloat(rawResult);
  return Number.isFinite(value) ? value : null;
}

function resultUnit(challengeType: SimulatorChallengeType, unit?: string) {
  if (unit) {
    return unit;
  }

  return challengeType === "LONGEST_DRIVE" ? "yd" : "ft/in";
}

function dateString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizedResultValue(
  challengeType: SimulatorChallengeType,
  rawResult: string,
) {
  const value = normalizeResult(rawResult);

  if (value === null) {
    return {
      normalizedValue: null,
      totalYards: undefined,
      distanceToPinInches: undefined,
    };
  }

  return challengeType === "LONGEST_DRIVE"
    ? { normalizedValue: value, totalYards: value, distanceToPinInches: undefined }
    : { normalizedValue: value, totalYards: undefined, distanceToPinInches: value };
}

function toSimulatorSession(session: PrismaSimulatorSession): SimulatorSession {
  return {
    id: session.id,
    pin2WinSessionId: session.pin2WinSessionId,
    provider: session.provider,
    status: session.status,
    challengeType: session.challengeType,
    playerAlias: session.playerAlias ?? undefined,
    operatorName: session.operatorName ?? undefined,
    venueName: session.venueName ?? undefined,
    bayName: session.bayName ?? undefined,
    course: session.course ?? undefined,
    hole: session.hole ?? undefined,
    teeBox: session.teeBox ?? undefined,
    pinLocation: session.pinLocation ?? undefined,
    attempts: session.attempts ?? undefined,
    playTimeMinutes: session.playTimeMinutes ?? undefined,
    e6SessionName: session.e6SessionName ?? undefined,
    e6SessionId: session.e6SessionId ?? undefined,
    externalSessionId: session.externalSessionId ?? undefined,
    syncEligible: session.syncEligible,
    createdAt: dateString(session.createdAt),
    updatedAt: dateString(session.updatedAt),
  };
}

function toSimulatorResult(
  result: PrismaSimulatorResult & {
    session?: Pick<PrismaSimulatorSession, "pin2WinSessionId">;
  },
): SimulatorResult {
  const normalizedValue =
    result.challengeType === "LONGEST_DRIVE"
      ? Number(result.totalYards)
      : Number(result.distanceToPinInches);

  return {
    id: result.id,
    sessionId: result.session?.pin2WinSessionId ?? result.sessionId,
    source: result.source,
    playerAlias: result.playerAlias ?? undefined,
    rawResult: result.rawResult,
    resultUnit: result.resultUnit,
    evidenceUrl: result.evidenceUrl ?? undefined,
    verifierName: result.verifierName ?? undefined,
    notes: result.notes ?? undefined,
    rawPayload: result.rawPayload ?? undefined,
    challengeType: result.challengeType,
    status: result.status,
    normalizedValue: Number.isFinite(normalizedValue) ? normalizedValue : null,
    createdAt: dateString(result.createdAt),
  };
}

function nextSessionSequence(sessions: SimulatorSession[]) {
  return sessions.reduce((highest, session) => {
    const sequence = Number.parseInt(
      session.pin2WinSessionId.split("-").at(-1) ?? "",
      10,
    );

    return Number.isFinite(sequence) ? Math.max(highest, sequence + 1) : highest;
  }, store.sequence);
}

function logPrismaFallback(action: string, error: unknown) {
  console.warn(
    `Simulator ${action} could not use Prisma. Falling back to local memory.`,
    error,
  );
}

export async function listSimulatorSessions() {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const sessions = await prisma.simulatorSession.findMany({
        orderBy: { createdAt: "desc" },
      });

      return sessions.map(toSimulatorSession);
    } catch (error) {
      logPrismaFallback("session list", error);
    }
  }

  return [...store.sessions.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function createSimulatorSession(input: SimulatorSessionInput) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const sessions = await listSimulatorSessions();
      const pin2WinSessionId = sessionId(nextSessionSequence(sessions));
      const session = await prisma.simulatorSession.create({
        data: {
          pin2WinSessionId,
          provider: input.provider ?? "TRUGOLF_APOGEE_E6",
          challengeType: input.challengeType,
          playerAlias: input.playerAlias,
          operatorName: input.operatorName,
          venueName: input.venueName,
          bayName: input.bayName,
          course: input.course,
          hole: input.hole,
          teeBox: input.teeBox,
          pinLocation: input.pinLocation,
          attempts: input.attempts,
          playTimeMinutes: input.playTimeMinutes,
          e6SessionName: input.e6SessionName,
          e6SessionId: input.e6SessionId,
          externalSessionId: input.externalSessionId,
          syncEligible: input.syncEligible ?? true,
        },
      });

      return toSimulatorSession(session);
    } catch (error) {
      logPrismaFallback("session create", error);
    }
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const session: SimulatorSession = {
    ...input,
    id,
    pin2WinSessionId: sessionId(store.sequence),
    provider: input.provider ?? "TRUGOLF_APOGEE_E6",
    status: "CREATED",
    createdAt: now,
    updatedAt: now,
  };

  store.sequence += 1;
  store.sessions.set(session.pin2WinSessionId, session);
  store.results.set(session.pin2WinSessionId, []);

  return session;
}

export async function getSimulatorSession(pin2WinSessionId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const session = await prisma.simulatorSession.findUnique({
        where: { pin2WinSessionId },
      });

      return session ? toSimulatorSession(session) : null;
    } catch (error) {
      logPrismaFallback("session lookup", error);
    }
  }

  return store.sessions.get(pin2WinSessionId) ?? null;
}

export async function updateSimulatorSession(
  pin2WinSessionId: string,
  input: Partial<SimulatorSessionInput> & { status?: SimulatorSessionStatus },
) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const session = await prisma.simulatorSession.update({
        where: { pin2WinSessionId },
        data: {
          provider: input.provider,
          status: input.status,
          challengeType: input.challengeType,
          playerAlias: input.playerAlias,
          operatorName: input.operatorName,
          venueName: input.venueName,
          bayName: input.bayName,
          course: input.course,
          hole: input.hole,
          teeBox: input.teeBox,
          pinLocation: input.pinLocation,
          attempts: input.attempts,
          playTimeMinutes: input.playTimeMinutes,
          e6SessionName: input.e6SessionName,
          e6SessionId: input.e6SessionId,
          externalSessionId: input.externalSessionId,
          syncEligible: input.syncEligible,
        },
      });

      return toSimulatorSession(session);
    } catch (error) {
      logPrismaFallback("session update", error);
    }
  }

  const existing = await getSimulatorSession(pin2WinSessionId);

  if (!existing) {
    return null;
  }

  const updated: SimulatorSession = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  store.sessions.set(pin2WinSessionId, updated);
  return updated;
}

export async function listSimulatorResults(pin2WinSessionId?: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const results = await prisma.simulatorResult.findMany({
        where: pin2WinSessionId
          ? { session: { pin2WinSessionId } }
          : undefined,
        include: { session: { select: { pin2WinSessionId: true } } },
        orderBy: { createdAt: "desc" },
      });

      return results.map(toSimulatorResult);
    } catch (error) {
      logPrismaFallback("result list", error);
    }
  }

  if (pin2WinSessionId) {
    return store.results.get(pin2WinSessionId) ?? [];
  }

  return [...store.results.values()].flat();
}

export async function createSimulatorResult(
  pin2WinSessionId: string,
  input: SimulatorResultInput,
) {
  const session = await getSimulatorSession(pin2WinSessionId);

  if (!session) {
    return null;
  }

  const prisma = getPrismaClient();
  const value = normalizedResultValue(session.challengeType, input.rawResult);
  const unit = resultUnit(session.challengeType, input.resultUnit);

  if (prisma) {
    try {
      const result = await prisma.simulatorResult.create({
        data: {
          sessionId: session.id,
          source: input.source ?? "MANUAL_ENTRY",
          status: "VERIFIED",
          challengeType: session.challengeType,
          playerAlias: input.playerAlias,
          rawResult: input.rawResult,
          resultUnit: unit,
          totalYards: value.totalYards,
          distanceToPinInches: value.distanceToPinInches,
          evidenceUrl: input.evidenceUrl,
          verifierName: input.verifierName,
          notes: input.notes,
          rawPayload: input.rawPayload as Prisma.InputJsonValue | undefined,
          verifiedAt: new Date(),
        },
        include: { session: { select: { pin2WinSessionId: true } } },
      });

      await updateSimulatorSession(pin2WinSessionId, { status: "VERIFIED" });

      return toSimulatorResult(result);
    } catch (error) {
      logPrismaFallback("result create", error);
    }
  }

  const result: SimulatorResult = {
    ...input,
    id: crypto.randomUUID(),
    sessionId: pin2WinSessionId,
    challengeType: session.challengeType,
    status: "VERIFIED",
    resultUnit: unit,
    normalizedValue: value.normalizedValue,
    createdAt: new Date().toISOString(),
  };
  const existing = store.results.get(pin2WinSessionId) ?? [];

  store.results.set(pin2WinSessionId, [result, ...existing]);
  updateSimulatorSession(pin2WinSessionId, { status: "VERIFIED" });

  return result;
}
