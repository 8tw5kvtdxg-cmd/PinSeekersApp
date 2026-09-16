import { Prisma } from "@/app/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/app-url";
import { prizePaymentTargetAt, winnerResponseDueAt } from "./winner-claim-policy.ts";

function database() {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for winner claims.");
  return prisma;
}

function noteText(note: string) {
  const trimmed = note.trim();
  if (trimmed.length < 20 || trimmed.length > 2000) throw new Error("Provide an attributed review note of 20 to 2000 characters.");
  if (/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/.test(trimmed)) throw new Error("Do not enter tax identifiers in ordinary review notes.");
  return trimmed;
}

export async function openPotentialWinnerClaim(input: { reportId: string; actorId: string; actorEmail: string; note: string }) {
  const note = noteText(input.note);
  return database().$transaction(async tx => {
    const report = await tx.holeInOneReport.findUnique({ where: { id: input.reportId }, include: { entry: true } });
    if (!report || report.status !== "Verified" || !report.entry.playerEmail || report.entry.paymentStatus !== "Succeeded" || report.entry.archivedAt) {
      throw new Error("A verified, active paid result with a customer email is required.");
    }
    const chronology = await tx.winnerChronology.findUnique({ where: { challengeSlug: report.challengeSlug } });
    if (chronology?.status !== "Provisional" || chronology.provisionalReportId !== report.id) {
      throw new Error("Chronology must name this verified report as its provisional leader.");
    }
    const existing = await tx.winnerClaim.findUnique({ where: { reportId: report.id } });
    if (existing) return existing;
    return tx.winnerClaim.create({ data: {
      reportId: report.id, challengeSlug: report.challengeSlug, entryId: report.entry.id,
      playerEmail: report.entry.playerEmail,
      events: { create: { actorId: input.actorId, actorEmail: input.actorEmail, action: "Potential claim opened", note } },
    } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function sendPotentialWinnerNotice(input: { claimId: string; actorId: string; actorEmail: string; note: string }) {
  const note = noteText(input.note);
  const prisma = database();
  const claim = await prisma.winnerClaim.findUnique({ where: { id: input.claimId } });
  if (!claim || claim.noticeSentAt || claim.status !== "Potential Winner") throw new Error("An unsent potential-winner claim is required.");
  const chronology = await prisma.winnerChronology.findUnique({ where: { challengeSlug: claim.challengeSlug } });
  if (chronology?.status !== "Provisional" || chronology.provisionalReportId !== claim.reportId) {
    throw new Error("Chronology changed; do not send a winner notice.");
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Winner notice email is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `winner-notice-${claim.id}` },
    body: JSON.stringify({ from, to: [claim.playerEmail], subject: "Pin2Win potential winner notice",
      text: `Your Pin2Win result is provisionally verified. You are a potential winner, not yet a final prize recipient. Please contact pin2wingolf@outlook.com within ten calendar days of this notice to acknowledge it and arrange secure eligibility and claim-document collection. Do not send a W-9, tax ID, or ID scan in ordinary email.\n\nOfficial rules: ${getAppBaseUrl()}/official-rules\nReference: ${claim.id}`,
    }),
  });
  if (!response.ok) throw new Error(`Potential-winner notice failed (${response.status}); retry the same claim.`);
  const sentAt = new Date();
  return prisma.$transaction(async tx => {
    const current = await tx.winnerClaim.findUnique({ where: { id: claim.id } });
    if (!current || current.noticeSentAt) return current;
    const currentChronology = await tx.winnerChronology.findUnique({ where: { challengeSlug: claim.challengeSlug } });
    if (currentChronology?.status !== "Provisional" || currentChronology.provisionalReportId !== claim.reportId) {
      throw new Error("Notice was accepted by email provider but chronology changed. Escalate to counsel and customer support.");
    }
    const updated = await tx.winnerClaim.update({ where: { id: claim.id }, data: {
      noticeSentAt: sentAt, responseDueAt: winnerResponseDueAt(sentAt), status: "Notified",
    } });
    await tx.winnerClaimEvent.create({ data: { claimId: claim.id, actorId: input.actorId, actorEmail: input.actorEmail, action: "Potential notice sent", note } });
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function updateWinnerClaim(input: {
  claimId: string; actorId: string; actorEmail: string; action: string; note: string;
  value?: string; amountCents?: number; method?: string;
}) {
  const note = noteText(input.note);
  const prisma = database();
  return prisma.$transaction(async tx => {
    const claim = await tx.winnerClaim.findUnique({ where: { id: input.claimId } });
    if (!claim) throw new Error("Winner claim not found.");
    if (["Refused", "Disqualified", "Paid", "Chronology Review", "Paid - Chronology Review"].includes(claim.status) && input.action !== "Tax Review") {
      throw new Error("This claim is closed; use a separately attributed successor or correction process.");
    }
    if (["Final Winner", "Payout Approved"].includes(claim.status) &&
      ["Response", "Eligibility", "Identity", "Residency", "Affidavit", "W9", "Collection Method"].includes(input.action)) {
      throw new Error("Finalized eligibility or documents cannot be silently changed; escalate a correction.");
    }
    const data: Prisma.WinnerClaimUpdateInput = {};
    if (input.action === "Response") {
      if (!claim.noticeSentAt || !["Accepted", "Refused"].includes(input.value || "")) throw new Error("A sent notice and valid response are required.");
      data.responseStatus = input.value; data.respondedAt = new Date();
      data.status = input.value === "Refused" ? "Refused" : "Claim Review";
    } else if (input.action === "Eligibility") {
      if (!claim.noticeSentAt || !["Verified", "Ineligible"].includes(input.value || "")) throw new Error("Select a valid eligibility decision after notice.");
      data.eligibilityStatus = input.value; if (input.value === "Ineligible") data.status = "Disqualified";
    } else if (["Identity", "Residency", "Affidavit", "W9"].includes(input.action)) {
      if (!["Not received", "Received securely", "Verified", "Rejected"].includes(input.value || "")) throw new Error("Select a valid document status.");
      if (input.value !== "Not received" && !claim.secureCollectionMethod) throw new Error("Record the secure collection method before marking documents received.");
      if (input.action === "Identity") data.identityStatus = input.value;
      if (input.action === "Residency") data.residencyStatus = input.value;
      if (input.action === "Affidavit") data.affidavitStatus = input.value;
      if (input.action === "W9") data.w9Status = input.value;
    } else if (input.action === "Collection Method") {
      const method = (input.value || "").trim();
      if (method.length < 10 || method.length > 200) throw new Error("Describe the secure collection method without entering document content.");
      data.secureCollectionMethod = method;
    } else if (input.action === "Tax Review") {
      if (!["CPA review pending", "CPA approved procedure", "Form prepared", "Form delivered", "Not required per CPA"].includes(input.value || "")) throw new Error("Select a tax-review status.");
      data.taxFormStatus = input.value;
    } else if (input.action === "Finalize") {
      if (claim.finalizedAt) throw new Error("This claim was already finalized.");
      if (claim.responseStatus !== "Accepted" || claim.eligibilityStatus !== "Verified" ||
        [claim.identityStatus, claim.residencyStatus, claim.affidavitStatus, claim.w9Status].some(status => status !== "Verified")) {
        throw new Error("Accepted response, verified eligibility, and securely verified documents are required for finalization.");
      }
      const chronology = await tx.winnerChronology.findUnique({ where: { challengeSlug: claim.challengeSlug } });
      if (chronology?.status !== "Provisional" || chronology.provisionalReportId !== claim.reportId) throw new Error("Chronology is unresolved or has changed.");
      const finalizedAt = new Date();
      data.status = "Final Winner"; data.finalizedAt = finalizedAt; data.payoutTargetAt = prizePaymentTargetAt(finalizedAt);
    } else if (input.action === "Approve Payout") {
      if (claim.payoutApprovedAt) throw new Error("Payout has already been approved; changes need a separate finance correction.");
      if (claim.status !== "Final Winner" || claim.responseStatus !== "Accepted" || claim.eligibilityStatus !== "Verified" ||
        [claim.identityStatus, claim.residencyStatus, claim.affidavitStatus, claim.w9Status].some(status => status !== "Verified") ||
        !["CPA approved procedure", "Form prepared", "Form delivered", "Not required per CPA"].includes(claim.taxFormStatus)) {
        throw new Error("Acceptance, eligibility, secure documents, and recorded CPA procedure are required before payout approval.");
      }
      const chronology = await tx.winnerChronology.findUnique({ where: { challengeSlug: claim.challengeSlug } });
      if (chronology?.status !== "Provisional" || chronology.provisionalReportId !== claim.reportId) throw new Error("Chronology must still name this claim as provisional leader.");
      if (!Number.isSafeInteger(input.amountCents) || (input.amountCents ?? 0) <= 0 || (input.amountCents ?? 0) > 500000) throw new Error("Enter a valid approved prize amount up to $5,000.");
      data.payoutApprovedAt = new Date(); data.payoutApprovedBy = input.actorId; data.payoutAmountCents = input.amountCents;
      data.status = "Payout Approved";
    } else if (input.action === "Paid") {
      if (claim.status !== "Payout Approved" || !claim.payoutApprovedAt || !claim.payoutAmountCents || claim.paidAt) throw new Error("A previously approved, unpaid prize is required.");
      const chronology = await tx.winnerChronology.findUnique({ where: { challengeSlug: claim.challengeSlug } });
      if (chronology?.status !== "Provisional" || chronology.provisionalReportId !== claim.reportId) throw new Error("Chronology has changed; do not record this as an authorized payout.");
      const method = (input.method || "").trim();
      if (method.length < 3 || method.length > 100) throw new Error("Record the external payout method.");
      data.paidAt = new Date(); data.payoutMethod = method; data.status = "Paid";
    } else throw new Error("Unknown winner-claim action.");
    const updated = await tx.winnerClaim.update({ where: { id: claim.id }, data });
    await tx.winnerClaimEvent.create({ data: {
      claimId: claim.id, actorId: input.actorId, actorEmail: input.actorEmail, action: input.action, note,
    } });
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
