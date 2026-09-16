import { Prisma } from "@/app/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";

function database() {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for participation holds.");
  return prisma;
}

export async function activeParticipationHold(userId: string) {
  return database().participationHold.findFirst({ where: { userId, status: "Active" },
    select: { id: true, reason: true },
  });
}

export async function activeParticipationHoldByEmail(email: string) {
  const user = await database().user.findFirst({ where: { email: { equals: email, mode: "insensitive" } },
    select: { participationHold: { select: { status: true } } },
  });
  return user?.participationHold?.status === "Active";
}

export async function changeParticipationHold(input: {
  email: string; action: "Hold" | "Release"; actorId: string; actorEmail: string; reason: string;
}) {
  const reason = input.reason.trim();
  if (reason.length < 20 || reason.length > 2000) throw new Error("Explain the eligibility or legal-acceptance decision in 20 to 2000 characters.");
  const email = input.email.trim().toLowerCase();
  return database().$transaction(async tx => {
    const user = await tx.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
    if (!user) throw new Error("Player account not found.");
    const current = await tx.participationHold.findUnique({ where: { userId: user.id } });
    if (input.action === "Hold") {
      if (current?.status === "Active") throw new Error("This account is already on hold.");
      const hold = current ? await tx.participationHold.update({ where: { id: current.id }, data: {
        status: "Active", reason, heldById: input.actorId, heldByEmail: input.actorEmail,
        releasedById: null, releasedByEmail: null, releasedAt: null,
      } }) : await tx.participationHold.create({ data: {
        userId: user.id, reason, heldById: input.actorId, heldByEmail: input.actorEmail,
      } });
      await tx.participationHoldEvent.create({ data: { holdId: hold.id, actorId: input.actorId, actorEmail: input.actorEmail, action: "Hold", reason } });
      return hold;
    }
    if (!current || current.status !== "Active") throw new Error("There is no active hold to release.");
    const released = await tx.participationHold.update({ where: { id: current.id }, data: {
      status: "Released", releasedById: input.actorId, releasedByEmail: input.actorEmail, releasedAt: new Date(),
    } });
    await tx.participationHoldEvent.create({ data: { holdId: current.id, actorId: input.actorId, actorEmail: input.actorEmail, action: "Release", reason } });
    return released;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
