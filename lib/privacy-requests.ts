import { Prisma } from "@/app/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { privacyRequestDueAt, validatePrivacyRequest } from "./privacy-request-policy.ts";
export { privacyRequestTypes } from "./privacy-request-policy.ts";

function database() {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for privacy requests.");
  return prisma;
}

export async function submitPrivacyRequest(input: {
  userId?: string; email: string; requestType: string; detail: string; relatedRequestId?: string;
}) {
  const detail = validatePrivacyRequest(input);
  const email = input.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  const now = new Date();
  return database().$transaction(async tx => {
    let relatedRequestId: string | null = null;
    if (input.requestType === "Appeal") {
      if (!input.userId) throw new Error("For a signed-out appeal, use the Privacy Policy email channel so we can verify the prior decision.");
      if (!input.relatedRequestId) throw new Error("Select the declined request you want to appeal.");
      const prior = await tx.privacyRequest.findFirst({ where: {
        id: input.relatedRequestId, userId: input.userId, decision: "Declined", status: "Resolved",
      }, select: { id: true } });
      if (!prior) throw new Error("Only your declined request can be appealed.");
      const existingAppeal = await tx.privacyRequest.findFirst({ where: {
        userId: input.userId, relatedRequestId: prior.id, requestType: "Appeal",
        status: { not: "Resolved" },
      }, select: { id: true } });
      if (existingAppeal) throw new Error("An appeal for this request is already open.");
      relatedRequestId = prior.id;
    }
    return tx.privacyRequest.create({ data: {
      userId: input.userId || null, email, requestType: input.requestType,
      relatedRequestId, detail, dueAt: privacyRequestDueAt(now),
      identityStatus: input.userId ? "Signed-in account; further verification may be required" : "Signed-out email; identity unverified",
      events: { create: {
        actorId: input.userId || "public-request", actorEmail: email, action: "Submitted",
        customerText: "Your privacy request was received. We may ask for additional information to verify your identity before acting.",
      } },
    } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function reviewPrivacyRequest(input: {
  requestId: string; actorId: string; actorEmail: string; action: string;
  note: string; customerText?: string; fulfillmentReference?: string;
}) {
  const note = input.note.trim();
  if (note.length < 10 || note.length > 2000) throw new Error("Review note must be 10 to 2000 characters.");
  const customerText = input.customerText?.trim() || "";
  if (customerText.length > 2000) throw new Error("Customer response is too long.");
  if (/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b|\b\d{13,19}\b/.test(`${note}\n${customerText}`)) {
    throw new Error("Do not place tax IDs or payment-card numbers in privacy notes or responses.");
  }
  if (!["In Review", "Identity Verified", "Need Verification", "Extend", "Complete", "Decline"].includes(input.action)) {
    throw new Error("Unknown privacy review action.");
  }
  return database().$transaction(async tx => {
    const request = await tx.privacyRequest.findUnique({ where: { id: input.requestId } });
    if (!request) throw new Error("Privacy request was not found.");
    if (request.status === "Resolved") throw new Error("This request is already resolved; use an appeal for a declined decision.");
    const now = new Date();
    let status = request.status;
    let identityStatus = request.identityStatus;
    let dueAt = request.dueAt;
    let extensionReason = request.extensionReason;
    let extendedAt = request.extendedAt;
    let decision = request.decision;
    let response = request.response;
    let fulfillmentReference = request.fulfillmentReference;
    let resolvedAt = request.resolvedAt;
    if (input.action === "In Review") status = "In Review";
    if (input.action === "Identity Verified") { identityStatus = "Verified by administrator"; status = "In Review"; }
    if (input.action === "Need Verification") {
      if (customerText.length < 10) throw new Error("Explain the verification request to the customer.");
      identityStatus = "Further verification needed"; status = "Needs Verification";
    }
    if (input.action === "Extend") {
      if (extendedAt || now > request.dueAt) throw new Error("An extension must be recorded once, before the original target date.");
      if (customerText.length < 10) throw new Error("Explain the extension to the customer.");
      extensionReason = note; extendedAt = now; dueAt = privacyRequestDueAt(request.dueAt);
    }
    if (input.action === "Complete" || input.action === "Decline") {
      if (identityStatus !== "Verified by administrator") throw new Error("Verify identity before a final privacy decision.");
      if (customerText.length < 20) throw new Error("Give the customer a substantive response of at least 20 characters.");
      if (input.action === "Complete") {
        const reference = input.fulfillmentReference?.trim() || "";
        if (reference.length < 10 || reference.length > 200) throw new Error("Record an external fulfillment or secure-delivery reference before completion.");
        fulfillmentReference = reference;
      }
      decision = input.action === "Complete" ? "Completed" : "Declined";
      response = customerText; resolvedAt = now; status = "Resolved";
    }
    const updated = await tx.privacyRequest.update({ where: { id: request.id }, data: {
      status, identityStatus, dueAt, extensionReason, extendedAt, decision, response, fulfillmentReference, resolvedAt,
      handledById: input.actorId, handledByEmail: input.actorEmail,
    } });
    await tx.privacyRequestEvent.create({ data: {
      requestId: request.id, actorId: input.actorId, actorEmail: input.actorEmail,
      action: input.action, note, customerText: customerText || null,
    } });
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
