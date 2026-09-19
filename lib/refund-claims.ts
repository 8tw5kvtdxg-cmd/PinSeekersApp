import { flagPaymentAlert, flagPaymentWithoutEntry, resolvePaymentAlert, type SystemPaymentIssue } from "./system-payment-alerts";
import { createHash } from "node:crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { createSquarePaymentRefund, getSquarePayment, getSquarePaymentRefund, squarePaymentLooksPaid } from "@/lib/square";
import { deriveRefundState, isLateRefundClaim } from "@/lib/refund-policy";
import { maxRefundEvidenceFilesPerClaim, type PreparedRefundEvidence } from "@/lib/refund-evidence";

export const refundReasons = [
  "Missing entry", "Duplicate charge", "Access not delivered", "Technical failure",
  "Challenge cancelled or closed", "Unused entry", "Incorrect amount", "Other payment issue",
] as const;

function database() {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for refund claims.");
  return prisma;
}

export async function submitPaymentIssue(input: {
  checkoutId: string; playerId: string; playerEmail: string; reason: string;
  venueName?: string; incidentAt?: Date | null; narrative: string; evidenceReference?: string;
  evidenceFile?: PreparedRefundEvidence | null;
}) {
  if (!refundReasons.includes(input.reason as (typeof refundReasons)[number])) throw new Error("Select a payment issue reason.");
  if (input.narrative.trim().length < 20 || input.narrative.length > 4000) throw new Error("Describe the issue in 20 to 4000 characters.");
  if ((input.evidenceReference?.length ?? 0) > 1000) throw new Error("Evidence reference is too long.");
  const prisma = database();
  const checkout = await prisma.squareCheckout.findUnique({ where: { id: input.checkoutId } });
  if (!checkout || checkout.playerEmail.toLowerCase() !== input.playerEmail.toLowerCase()) {
    throw new Error("Payment record is not available for this account.");
  }
  const entry = checkout.entryId
    ? await prisma.clubhouseEntryRecord.findUnique({ where: { id: checkout.entryId } })
    : await prisma.clubhouseEntryRecord.findUnique({ where: { squareCheckoutId: checkout.id } });
  const incidentAt = input.incidentAt ?? null;
  if (incidentAt && (!Number.isFinite(incidentAt.getTime()) || incidentAt > new Date(Date.now() + 86400000) || incidentAt < new Date("2020-01-01"))) {
    throw new Error("Incident date is not valid.");
  }
  return prisma.paymentIssueClaim.create({
    data: {
      checkoutId: checkout.id, entryId: entry?.id, playerId: input.playerId,
      playerEmail: input.playerEmail, reason: input.reason,
      venueName: input.venueName?.trim().slice(0, 200) || checkout.locationName,
      incidentAt, narrative: input.narrative.trim(),
      evidenceReference: input.evidenceReference?.trim() || null,
      evidenceFiles: input.evidenceFile ? { create: {
        uploadedById: input.playerId, originalName: input.evidenceFile.originalName,
        mimeType: input.evidenceFile.mimeType, sizeBytes: input.evidenceFile.sizeBytes,
        sha256: input.evidenceFile.sha256, content: input.evidenceFile.content,
      } } : undefined,
      // A payment link may predate payment by days. Unknown paid-at dates require human review,
      // never an automatic late flag based on link creation.
      lateSubmissionFlag: checkout.squarePaidAt ? isLateRefundClaim(checkout.squarePaidAt, incidentAt) : false,
      events: { create: { actorId: input.playerId, actorEmail: input.playerEmail, action: "Submitted" } },
    },
  });
}

export async function addPaymentIssueEvidence(input: {
  claimId: string; playerId: string; playerEmail: string; evidenceFile: PreparedRefundEvidence;
}) {
  return database().$transaction(async (tx) => {
    const claim = await tx.paymentIssueClaim.findUnique({ where: { id: input.claimId }, select: {
      id: true, playerId: true, status: true,
    } });
    if (!claim || claim.playerId !== input.playerId) throw new Error("Claim is not available for this account.");
    if (["Denied", "Refunded", "Partially Refunded", "Resolved"].includes(claim.status)) {
      throw new Error("This claim is closed; contact support to submit additional evidence.");
    }
    const count = await tx.paymentIssueEvidence.count({ where: { claimId: claim.id } });
    if (count >= maxRefundEvidenceFilesPerClaim) throw new Error("This claim already has the maximum of five evidence files.");
    const evidence = await tx.paymentIssueEvidence.create({ data: {
      claimId: claim.id, uploadedById: input.playerId,
      originalName: input.evidenceFile.originalName, mimeType: input.evidenceFile.mimeType,
      sizeBytes: input.evidenceFile.sizeBytes, sha256: input.evidenceFile.sha256,
      content: input.evidenceFile.content,
    } });
    await tx.paymentIssueEvent.create({ data: {
      claimId: claim.id, actorId: input.playerId, actorEmail: input.playerEmail,
      action: "Evidence uploaded", meta: { evidenceId: evidence.id, mimeType: evidence.mimeType },
    } });
    return evidence.id;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function flagConfirmedPaymentWithoutEntry(checkoutId: string) {
  return flagPaymentWithoutEntry(database(), checkoutId);
}

export async function resolveRecoveredPaymentIssue(checkoutId: string) {
  return resolvePaymentAlert(database(), checkoutId, "paid-without-entry");
}

export async function flagSystemPaymentIssue(input: SystemPaymentIssue) {
  return flagPaymentAlert(database(), input);
}

export async function resolveSystemPaymentIssue(checkoutId: string, issueCode: string) {
  return resolvePaymentAlert(database(), checkoutId, issueCode);
}

export async function updatePaymentIssueReview(input: {
  claimId: string; actorId: string; actorEmail: string;
  status: "In Review" | "Denied" | "Approved"; assignedTo?: string; note: string; customerMessage?: string;
}) {
  if (input.note.trim().length < 10 || input.note.length > 2000) throw new Error("A decision note of at least 10 characters is required.");
  if (input.status !== "In Review" && (!input.customerMessage || input.customerMessage.trim().length < 10 || input.customerMessage.length > 2000)) {
    throw new Error("Approval or denial needs a customer-facing explanation of 10 to 2000 characters.");
  }
  return database().$transaction(async (tx) => {
    const claim = await tx.paymentIssueClaim.findUnique({ where: { id: input.claimId }, include: { refund: true } });
    if (!claim) throw new Error("Claim not found.");
    if (claim.refund || ["Refund Requested", "Refund Pending", "Refunded"].includes(claim.status)) throw new Error("Refund processing has begun; review its status instead.");
    await tx.paymentIssueEvent.create({ data: {
      claimId: claim.id, actorId: input.actorId, actorEmail: input.actorEmail,
      action: input.status, note: input.note.trim(), customerMessage: input.customerMessage?.trim() || null,
      meta: { previousStatus: claim.status },
    } });
    return tx.paymentIssueClaim.update({ where: { id: claim.id }, data: {
      status: input.status, assignedTo: input.assignedTo?.trim().slice(0, 200) || input.actorEmail,
    } });
  });
}

async function applyRefundStatus(attemptId: string, refundId: string, status: string, actorId: string, actorEmail: string) {
  return database().$transaction(async (tx) => {
    const attempt = await tx.squareRefundAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new Error("Refund attempt not found.");
    if (attempt.providerRefundId && attempt.providerRefundId !== refundId) throw new Error("Refund ID mismatch; manual review required.");
    if (attempt.providerStatus === "COMPLETED" && status !== "COMPLETED") return attempt;
    if (["FAILED", "REJECTED"].includes(attempt.providerStatus) && status === "PENDING") return attempt;
    const checkout = await tx.squareCheckout.findUnique({ where: { id: attempt.checkoutId } });
    if (!checkout) throw new Error("Checkout not found.");
    const completedAmount = await tx.squareRefundAttempt.aggregate({
      where: { checkoutId: checkout.id, providerStatus: "COMPLETED", id: { not: attempt.id } },
      _sum: { amountCents: true },
    });
    const refundedAmountCents = (completedAmount._sum.amountCents ?? 0) + (status === "COMPLETED" ? attempt.amountCents : 0);
    const { refundStatus, claimStatus, entryPaymentStatus } = deriveRefundState({
      providerStatus: status, completedAmountCents: refundedAmountCents, checkoutAmountCents: checkout.amountCents,
    });
    const changed = attempt.providerStatus !== status;
    await tx.squareRefundAttempt.update({ where: { id: attempt.id }, data: {
      providerRefundId: refundId, providerStatus: status, lastCheckedAt: new Date(),
    } });
    await tx.squareCheckout.update({ where: { id: checkout.id }, data: { refundStatus, refundedAmountCents } });
    await tx.clubhouseEntryRecord.updateMany({ where: { squareCheckoutId: checkout.id }, data: {
      paymentStatus: entryPaymentStatus,
      refundStatus, refundedAmountCents,
    } });
    await tx.paymentIssueClaim.update({ where: { id: attempt.claimId }, data: { status: claimStatus } });
    if (changed) await tx.paymentIssueEvent.create({ data: {
      claimId: attempt.claimId, actorId, actorEmail, action: `Square refund ${status}`,
      meta: { refundId, amountCents: attempt.amountCents },
    } });
    return attempt;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function requestApprovedSquareRefund(input: {
  claimId: string; actorId: string; actorEmail: string; amountCents: number; note: string;
}) {
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents < 1) throw new Error("Refund amount must be positive cents.");
  if (input.note.trim().length < 10 || input.note.length > 2000) throw new Error("Explain the refund decision in 10 to 2000 characters.");
  const prisma = database();
  const claim = await prisma.paymentIssueClaim.findUnique({ where: { id: input.claimId }, include: { refund: true } });
  if (!claim || !["Approved", "Refund Requested"].includes(claim.status)) throw new Error("Approve the claim before requesting a Square refund.");
  const checkout = await prisma.squareCheckout.findUnique({ where: { id: claim.checkoutId } });
  if (!checkout || checkout.status !== "Succeeded" || !checkout.squarePaymentId) {
    throw new Error("A confirmed Square payment ID is required; reconcile or review this payment first.");
  }
  const entry = await prisma.clubhouseEntryRecord.findUnique({
    where: { squareCheckoutId: checkout.id }, include: { holeInOneReport: true },
  });
  const paymentPayload = await getSquarePayment({ paymentId: checkout.squarePaymentId });
  if (!squarePaymentLooksPaid(paymentPayload, { orderId: checkout.squareOrderId, amountCents: checkout.amountCents })) {
    throw new Error("Square did not verify the original completed USD payment; refund blocked.");
  }
  const payment = (paymentPayload?.payment ?? {}) as Record<string, unknown>;
  const refundedMoney = (payment.refunded_money ?? {}) as Record<string, unknown>;
  const externallyRefunded = Number(refundedMoney.amount ?? 0);
  if (!Number.isSafeInteger(externallyRefunded) || externallyRefunded < 0) throw new Error("Square refunded amount is not verifiable.");
  if (externallyRefunded > 0 && refundedMoney.currency !== "USD") throw new Error("Square refunded currency is not verifiable as USD.");
  if (input.amountCents >= checkout.amountCents - Math.max(checkout.refundedAmountCents, externallyRefunded) &&
      (entry?.resultStatus === "Verified" || entry?.holeInOneReport?.status === "Verified")) {
    throw new Error("A verified result is attached to this entry; full refund requires separate prize/legal review.");
  }
  const attempt = await prisma.$transaction(async (tx) => {
    const existing = await tx.squareRefundAttempt.findUnique({ where: { claimId: claim.id } });
    if (existing) {
      if (existing.amountCents !== input.amountCents) throw new Error("Existing refund amount differs; review the original attempt.");
      return existing;
    }
    const current = await tx.paymentIssueClaim.findUnique({ where: { id: claim.id } });
    if (current?.status !== "Approved") throw new Error("Claim is no longer approved.");
    const committed = await tx.squareRefundAttempt.aggregate({
      where: { checkoutId: checkout.id, providerStatus: "COMPLETED" },
      _sum: { amountCents: true },
    });
    const inFlight = await tx.squareRefundAttempt.aggregate({
      where: { checkoutId: checkout.id, providerStatus: { in: ["Reserved", "Submitting", "Unknown", "PENDING"] } },
      _sum: { amountCents: true },
    });
    const unavailable = Math.max(committed._sum.amountCents ?? 0, externallyRefunded) + (inFlight._sum.amountCents ?? 0);
    if (input.amountCents > checkout.amountCents - unavailable) {
      throw new Error("Refund exceeds the verified unrefunded payment balance.");
    }
    const idempotencyKey = createHash("sha256").update(`pin2win-refund:${claim.id}`).digest("hex").slice(0, 40);
    const created = await tx.squareRefundAttempt.create({ data: {
      claimId: claim.id, checkoutId: checkout.id, paymentId: checkout.squarePaymentId!,
      amountCents: input.amountCents, idempotencyKey,
    } });
    await tx.paymentIssueClaim.update({ where: { id: claim.id }, data: { status: "Refund Requested" } });
    await tx.squareCheckout.update({ where: { id: checkout.id }, data: { refundStatus: "Refund Requested" } });
    await tx.clubhouseEntryRecord.updateMany({ where: { squareCheckoutId: checkout.id }, data: { paymentStatus: "Refund Pending", refundStatus: "Refund Requested" } });
    await tx.paymentIssueEvent.create({ data: {
      claimId: claim.id, actorId: input.actorId, actorEmail: input.actorEmail,
      action: "Refund reserved", note: input.note.trim().slice(0, 2000),
      meta: { amountCents: input.amountCents, paymentId: checkout.squarePaymentId },
    } });
    return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (attempt.providerRefundId) return attempt;
  const lease = await prisma.squareRefundAttempt.updateMany({
    where: { id: attempt.id, providerStatus: { in: ["Reserved", "Unknown"] } },
    data: { providerStatus: "Submitting", lastCheckedAt: new Date() },
  });
  if (!lease.count) return attempt;
  try {
    const refund = await createSquarePaymentRefund({
      paymentId: attempt.paymentId, amountCents: attempt.amountCents,
      idempotencyKey: attempt.idempotencyKey, reason: `Pin2Win ${claim.reason} claim ${claim.id}`,
    });
    await applyRefundStatus(attempt.id, refund.id, refund.status, input.actorId, input.actorEmail);
  } catch (error) {
    await prisma.squareRefundAttempt.updateMany({ where: { id: attempt.id, providerStatus: "Submitting" }, data: { providerStatus: "Unknown" } });
    await prisma.paymentIssueEvent.create({ data: {
      claimId: claim.id, actorId: input.actorId, actorEmail: input.actorEmail,
      action: "Refund response uncertain", note: "Check Square before retrying with the same idempotency key.",
    } });
    throw error;
  }
  return prisma.squareRefundAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
}

export async function reconcileSquareRefunds(limit = 20) {
  const prisma = database();
  await prisma.squareRefundAttempt.updateMany({
    where: { providerStatus: "Submitting", providerRefundId: null, lastCheckedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
    data: { providerStatus: "Unknown" },
  });
  const attempts = await prisma.squareRefundAttempt.findMany({
    where: { providerRefundId: { not: null }, providerStatus: { in: ["PENDING", "Unknown"] } },
    orderBy: { lastCheckedAt: "asc" }, take: limit,
  });
  let updated = 0;
  for (const attempt of attempts) {
    try {
      const refund = await getSquarePaymentRefund({
        refundId: attempt.providerRefundId!, paymentId: attempt.paymentId, amountCents: attempt.amountCents,
      });
      await applyRefundStatus(attempt.id, refund.id, refund.status, "system", "Square reconciliation");
      updated++;
    } catch {
      // Keep the attempt visible for administrator review and the next scheduled sweep.
    }
  }
  return { scanned: attempts.length, updated };
}

export async function reconcileSquareRefundById(refundId: string) {
  const attempt = await database().squareRefundAttempt.findUnique({ where: { providerRefundId: refundId } });
  if (!attempt) return false;
  const refund = await getSquarePaymentRefund({
    refundId, paymentId: attempt.paymentId, amountCents: attempt.amountCents,
  });
  await applyRefundStatus(attempt.id, refund.id, refund.status, "system", "Square webhook reconciliation");
  return true;
}
