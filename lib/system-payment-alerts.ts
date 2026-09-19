import type { PrismaClient } from "../app/generated/prisma/client";

type AlertDatabase = Pick<PrismaClient, "squareCheckout" | "clubhouseEntryRecord" | "paymentReconciliationIssue">;
export type SystemPaymentIssue = {
  checkoutId: string; issueCode: string; entryId?: string;
  reason: string; narrative: string; action: string;
};

// Automated signals are staff-only reconciliation alerts. They never create
// customer claims, claim events, email deliveries, or provider refund attempts.
export async function flagPaymentAlert(db: AlertDatabase, input: SystemPaymentIssue) {
  const checkout = await db.squareCheckout.findUnique({ where: { id: input.checkoutId } });
  if (!checkout || checkout.status !== "Succeeded" || ["Refund Requested", "Refund Pending", "Refunded"].includes(checkout.refundStatus)) return null;
  const data = { type: input.action, checkoutId: checkout.id, entryId: input.entryId,
    detail: input.narrative, customerEmail: null };
  return db.paymentReconciliationIssue.upsert({
    where: { key: `payment-alert:${input.issueCode}:${checkout.id}` },
    create: { key: `payment-alert:${input.issueCode}:${checkout.id}`, ...data, status: "Open" },
    update: { ...data, status: "Open", resolvedAt: null },
  });
}

export async function flagPaymentWithoutEntry(db: AlertDatabase, checkoutId: string) {
  const entry = await db.clubhouseEntryRecord.findUnique({ where: { squareCheckoutId: checkoutId } });
  if (entry) return null;
  return flagPaymentAlert(db, { checkoutId, issueCode: "paid-without-entry", reason: "Missing entry",
    narrative: "A completed Square payment has no usable Pin2Win entry after automated recovery. Staff review is required. No customer claim or refund was submitted.",
    action: "Paid without entry detected" });
}

export async function resolvePaymentAlert(db: AlertDatabase, checkoutId: string, issueCode: string) {
  return db.paymentReconciliationIssue.updateMany({
    where: { key: `payment-alert:${issueCode}:${checkoutId}`, status: "Open" },
    data: { status: "Resolved", resolvedAt: new Date() },
  });
}
