import { Prisma } from "@/app/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { deriveWinnerChronology } from "@/lib/winner-chronology-policy";
import { clubhouseChallengeSlugs } from "@/lib/clubhouse";

function requiredPrisma() {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for hole-in-one review.");
  return prisma;
}

function boundedText(value: unknown, label: string, maximum = 2000) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.length > maximum) throw new Error(`${label} is required and must be at most ${maximum} characters.`);
  return text;
}

async function holdSales(tx: Prisma.TransactionClient, challengeSlug: string) {
  const setting = await tx.clubhouseChallengeSetting.findUnique({ where: { challengeSlug } });
  if (setting?.salesState === "Closed") return;
  await tx.clubhouseChallengeSetting.upsert({
    where: { challengeSlug },
    create: { challengeSlug, salesState: "Paused", salesHoldReason: "Potential hole-in-one reported", salesHeldAt: new Date() },
    update: { salesState: "Paused", salesHoldReason: "Potential hole-in-one reported", salesHeldAt: setting?.salesHeldAt ?? new Date() },
  });
}

export async function getChallengeSalesState(challengeSlug: string) {
  const setting = await requiredPrisma().clubhouseChallengeSetting.findUnique({
    where: { challengeSlug }, select: { salesState: true },
  });
  return setting?.salesState ?? "Open";
}

export async function reportPlayerHoleInOne(input: {
  entryId: string;
  playerId: string;
  statement: unknown;
}) {
  const statement = boundedText(input.statement, "Hole-in-one statement");
  const prisma = requiredPrisma();
  return prisma.$transaction(async (tx) => {
    const entry = await tx.clubhouseEntryRecord.findUnique({ where: { id: input.entryId } });
    if (!entry || entry.archivedAt || entry.paymentStatus !== "Succeeded") {
      throw new Error("An active paid entry is required.");
    }
    if (entry.challengeSlug !== clubhouseChallengeSlugs.holeInOne) throw new Error("This is not a hole-in-one entry.");
    const existing = await tx.holeInOneReport.findUnique({ where: { entryId: input.entryId } });
    if (existing) return existing;
    const report = await tx.holeInOneReport.create({
      data: {
        challengeSlug: entry.challengeSlug, entryId: entry.id,
        reportSource: "Player", reportedBy: input.playerId,
        playerStatement: statement,
      },
    });
    await tx.holeInOneReviewEvent.create({
      data: { reportId: report.id, actorId: input.playerId, action: "Player report received", note: statement },
    });
    await tx.clubhouseEntryRecord.update({
      where: { id: entry.id },
      data: { result: "Potential hole-in-one reported", resultStatus: "Needs Review", resultValue: null, resultUnit: null, evidence: statement },
    });
    await holdSales(tx, entry.challengeSlug);
    return report;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function reportSimulatorHoleInOne(input: {
  entryId: string;
  provider: unknown;
  sessionId: unknown;
  shotId: unknown;
  shotAt: unknown;
  playerAlias: unknown;
  venueName: unknown;
  bayName: unknown;
  evidenceReference: unknown;
  strokeCount: unknown;
  ballHoled: unknown;
  designatedTee: unknown;
}) {
  const provider = boundedText(input.provider, "Simulator provider", 100);
  const sessionId = boundedText(input.sessionId, "Simulator session ID", 200);
  const shotId = boundedText(input.shotId, "Simulator shot ID", 200);
  const playerAlias = boundedText(input.playerAlias, "Simulator player alias", 200);
  const venueName = boundedText(input.venueName, "Simulator venue", 200);
  const bayName = boundedText(input.bayName, "Simulator bay", 200);
  const evidenceReference = boundedText(input.evidenceReference, "Simulator evidence reference", 1000);
  const shotAt = new Date(typeof input.shotAt === "string" ? input.shotAt : "");
  if (!Number.isFinite(shotAt.getTime()) || shotAt.getTime() > Date.now() + 5 * 60_000) {
    throw new Error("A valid simulator shot timestamp is required.");
  }
  if (input.strokeCount !== 1 || input.ballHoled !== true || input.designatedTee !== true) {
    throw new Error("The simulator must identify a ball holed from the designated tee in one stroke.");
  }

  const prisma = requiredPrisma();
  return prisma.$transaction(async (tx) => {
    const entry = await tx.clubhouseEntryRecord.findUnique({ where: { id: input.entryId } });
    if (!entry || entry.archivedAt || entry.paymentStatus !== "Succeeded") {
      throw new Error("An active paid entry is required.");
    }
    if (entry.challengeSlug !== clubhouseChallengeSlugs.holeInOne) throw new Error("This is not a hole-in-one entry.");
    if (entry.e6DisplayName.toLowerCase() !== playerAlias.toLowerCase()) {
      throw new Error("Simulator player alias does not match the entry.");
    }
    if (shotAt < entry.createdAt) throw new Error("Simulator shot predates the paid entry.");
    const existing = await tx.holeInOneReport.findUnique({ where: { entryId: entry.id } });
    if (existing?.simulatorShotId) {
      if (existing.simulatorProvider === provider && existing.simulatorShotId === shotId) return existing;
      throw new Error("This entry already has a different simulator shot attached.");
    }
    if (existing && existing.status !== "Pending Review") {
      throw new Error("A reviewed report cannot be changed.");
    }
    const data = {
      reportSource: "Simulator",
      evidenceReference,
      simulatorProvider: provider,
      simulatorSessionId: sessionId,
      simulatorShotId: shotId,
      simulatorAlias: playerAlias,
      simulatorVenue: venueName,
      simulatorBay: bayName,
      strokeCount: 1,
      ballHoled: true,
      designatedTee: true,
      shotAt,
    };
    const report = existing
      ? await tx.holeInOneReport.update({ where: { id: existing.id }, data })
      : await tx.holeInOneReport.create({
          data: { ...data, challengeSlug: entry.challengeSlug, entryId: entry.id, reportedBy: `simulator:${provider}` },
        });
    await tx.holeInOneReviewEvent.create({
      data: {
        reportId: report.id, actorId: `simulator:${provider}`,
        action: "Authenticated simulator evidence received",
        metadata: { sessionId, shotId, shotAt: shotAt.toISOString(), evidenceReference },
      },
    });
    await tx.clubhouseEntryRecord.update({
      where: { id: entry.id },
      data: { result: "Potential hole-in-one reported", resultStatus: "Needs Review", resultValue: null, resultUnit: null, evidence: evidenceReference },
    });
    await holdSales(tx, entry.challengeSlug);
    return report;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function reviewHoleInOneReport(input: {
  reportId: string;
  action: "Verify" | "Reject";
  actorId: string;
  actorEmail: string;
  note: unknown;
  timestampReliable: boolean;
}) {
  const note = boundedText(input.note, "Review note", 2000);
  if (note.length < 20) throw new Error("Review note must explain the evidence in at least 20 characters.");
  const prisma = requiredPrisma();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const report = await tx.holeInOneReport.findUnique({
          where: { id: input.reportId }, include: { entry: true },
        });
        if (!report || report.status !== "Pending Review") {
          throw new Error("Pending hole-in-one report not found.");
        }
        let verificationMetadata: {
          shotAt: string;
          simulatorShotId: string;
          timestampReliable: boolean;
          periodStartsAt: string;
          periodEndsAt: string;
          entryId: string;
          simulatorVenue: string;
          simulatorBay: string;
        } | undefined;
        if (input.action === "Verify") {
          if (
            report.reportSource !== "Simulator" || !report.simulatorProvider ||
            !report.simulatorSessionId || !report.simulatorShotId || !report.simulatorAlias ||
            !report.simulatorVenue || !report.simulatorBay ||
            !report.evidenceReference || !report.shotAt || report.strokeCount !== 1 ||
            report.ballHoled !== true || report.designatedTee !== true
          ) {
            throw new Error("Authenticated simulator shot, timestamp, and evidence are required before verification.");
          }
          if (
            report.entry.archivedAt || report.entry.paymentStatus !== "Succeeded" ||
            report.entry.entryDecisionStatus !== "Confirmed" ||
            report.entry.e6DisplayName.toLowerCase() !== report.simulatorAlias.toLowerCase() ||
            !report.entry.bayName ||
            report.entry.locationName === "All partner locations" ||
            report.entry.bayName === "Any active simulator bay" ||
            report.entry.locationName.toLowerCase() !== report.simulatorVenue.toLowerCase() ||
            report.entry.bayName.toLowerCase() !== report.simulatorBay.toLowerCase()
          ) {
            throw new Error("The entry must be active, paid, confirmed, and matched to the simulator player, venue, and bay.");
          }
          const heldPlayer = report.entry.playerEmail ? await tx.user.findFirst({
            where: { email: { equals: report.entry.playerEmail, mode: "insensitive" } },
            select: { participationHold: { select: { status: true } } },
          }) : null;
          if (heldPlayer?.participationHold?.status === "Active") {
            throw new Error("This player is under an eligibility hold; resolve it before result verification.");
          }
          const setting = await tx.clubhouseChallengeSetting.findUnique({
            where: { challengeSlug: report.challengeSlug },
          });
          if (!setting?.startsAt || !setting.endsAt || report.shotAt < setting.startsAt || report.shotAt > setting.endsAt) {
            throw new Error("The simulator shot must fall within the configured challenge period.");
          }
          verificationMetadata = {
            shotAt: report.shotAt.toISOString(),
            simulatorShotId: report.simulatorShotId!,
            timestampReliable: input.timestampReliable,
            periodStartsAt: setting.startsAt.toISOString(),
            periodEndsAt: setting.endsAt.toISOString(),
            entryId: report.entryId,
            simulatorVenue: report.simulatorVenue!,
            simulatorBay: report.simulatorBay!,
          };
        }

        const now = new Date();
        const updated = await tx.holeInOneReport.update({
          where: { id: report.id },
          data: input.action === "Verify"
            ? { status: "Verified", verifiedBy: input.actorId, verifiedAt: now, reviewNote: note, timestampReliable: input.timestampReliable }
            : { status: "Rejected", verifiedBy: input.actorId, verifiedAt: now, reviewNote: note },
        });
        await tx.holeInOneReviewEvent.create({
          data: {
            reportId: report.id, actorId: input.actorId, actorEmail: input.actorEmail,
            action: input.action === "Verify" ? "Simulator result verified" : "Potential result rejected",
            note,
            metadata: verificationMetadata,
          },
        });
        await tx.clubhouseEntryRecord.update({
          where: { id: report.entryId },
          data: input.action === "Verify"
            ? { result: "Hole-in-one", resultStatus: "Verified", resultValue: 0, resultUnit: "inches", evidence: report.evidenceReference }
            : { result: "Potential hole-in-one rejected", resultStatus: "Rejected", resultValue: null, resultUnit: null, evidence: note },
        });
        if (input.action === "Verify") {
          const verified = await tx.holeInOneReport.findMany({
            where: { challengeSlug: report.challengeSlug, status: "Verified" },
            select: { id: true, shotAt: true, timestampReliable: true },
          });
          const chronology = deriveWinnerChronology(
            verified.filter((candidate): candidate is { id: string; shotAt: Date; timestampReliable: boolean | null } => Boolean(candidate.shotAt)),
          );
          await tx.winnerChronology.upsert({
            where: { challengeSlug: report.challengeSlug },
            create: { challengeSlug: report.challengeSlug, ...chronology, decidedAt: now },
            update: { ...chronology, decidedAt: now },
          });
          const affectedClaims = await tx.winnerClaim.findMany({ where: {
            challengeSlug: report.challengeSlug,
            status: { notIn: ["Refused", "Disqualified", "Chronology Review", "Paid - Chronology Review"] },
            ...(chronology.status === "Provisional" && chronology.provisionalReportId
              ? { reportId: { not: chronology.provisionalReportId } } : {}),
          }, select: { id: true, paidAt: true } });
          for (const claim of affectedClaims) {
            await tx.winnerClaim.update({ where: { id: claim.id }, data: {
              status: claim.paidAt ? "Paid - Chronology Review" : "Chronology Review",
            } });
            await tx.winnerClaimEvent.create({ data: {
              claimId: claim.id, actorId: "system", actorEmail: "result chronology",
              action: "Chronology changed; claim suspended",
              note: "A later verified report changed or invalidated the provisional leader. Suspend notice or payout and escalate for legal and finance review.",
            } });
          }
          await tx.clubhouseChallengeSetting.update({
            where: { challengeSlug: report.challengeSlug },
            data: { salesState: "Closed", salesHoldReason: "Verified hole-in-one", salesHeldAt: now },
          });
        }
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034" && attempt < 3) continue;
      throw error;
    }
  }
  throw new Error("Could not resolve concurrent winner review.");
}

export async function resumeChallengeSales(input: {
  challengeSlug: string;
  actorId: string;
  actorEmail: string;
  note: unknown;
}) {
  const note = boundedText(input.note, "Resume reason", 2000);
  const prisma = requiredPrisma();
  return prisma.$transaction(async (tx) => {
    const pendingOrVerified = await tx.holeInOneReport.count({
      where: { challengeSlug: input.challengeSlug, status: { in: ["Pending Review", "Verified"] } },
    });
    if (pendingOrVerified) throw new Error("Sales cannot resume while a potential or verified hole-in-one remains.");
    const latest = await tx.holeInOneReport.findFirst({
      where: { challengeSlug: input.challengeSlug }, orderBy: { reportedAt: "desc" },
    });
    if (!latest) throw new Error("No result hold exists for this challenge.");
    const setting = await tx.clubhouseChallengeSetting.findUnique({ where: { challengeSlug: input.challengeSlug } });
    if (!setting || setting.salesState !== "Paused") throw new Error("Challenge sales are not paused.");
    await tx.clubhouseChallengeSetting.update({
      where: { challengeSlug: input.challengeSlug },
      data: { salesState: "Open", salesHoldReason: null, salesHeldAt: null },
    });
    await tx.holeInOneReviewEvent.create({
      data: { reportId: latest.id, actorId: input.actorId, actorEmail: input.actorEmail, action: "Challenge sales resumed", note },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
