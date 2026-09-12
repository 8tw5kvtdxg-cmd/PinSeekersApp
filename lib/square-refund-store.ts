import { createHash, randomUUID } from "node:crypto";
import { getPrismaClient } from "@/lib/prisma";
import {
  getSquarePayment,
  getSquareRefund,
  refundSquarePayment,
  squarePaymentLooksPaid,
  type SquareRefund,
} from "@/lib/square";

export type SquareRefundRecordView = {
  id: string;
  entryId: string;
  checkoutId: string;
  paymentId: string;
  amountCents: number;
  currency: string;
  reason: string;
  status: string;
  squareRefundId?: string;
  requestedBy: string;
  failureDetail?: string;
  requestedAt: string;
  completedAt?: string;
};

function toView(record: {
  id: string;
  entryId: string;
  checkoutId: string;
  paymentId: string;
  amountCents: number;
  currency: string;
  reason: string;
  status: string;
  squareRefundId: string | null;
  requestedBy: string;
  failureDetail: string | null;
  requestedAt: Date;
  completedAt: Date | null;
}): SquareRefundRecordView {
  return {
    ...record,
    squareRefundId: record.squareRefundId ?? undefined,
    failureDetail: record.failureDetail ?? undefined,
    requestedAt: record.requestedAt.toISOString(),
    completedAt: record.completedAt?.toISOString(),
  };
}

function refundIdempotencyKey(entryId: string) {
  const digest = createHash("sha256").update(entryId).digest("hex").slice(0, 28);
  return `p2w-refund-${digest}`;
}

function platformPaymentStatus(refund: SquareRefund, originalAmountCents: number) {
  if (refund.status === "PENDING") {
    return "Refund Pending";
  }

  if (refund.status === "COMPLETED") {
    return refund.amountCents < originalAmountCents
      ? "Partially Refunded"
      : "Refunded";
  }

  return "Succeeded";
}

async function applySquareRefundState(input: {
  refund: SquareRefund;
  auditEventId?: string;
  auditSource: "admin" | "webhook";
}) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is required for Square refunds.");
  }

  return prisma.$transaction(
    async (transaction) => {
      const record = await transaction.squareRefundRecord.findFirst({
        where: {
          OR: [
            { squareRefundId: input.refund.id },
            { paymentId: input.refund.paymentId },
          ],
        },
      });

      if (!record) {
        return null;
      }

      if (
        record.paymentId !== input.refund.paymentId ||
        record.amountCents !== input.refund.amountCents ||
        input.refund.currency !== record.currency
      ) {
        throw new Error("Square refund update does not match the reserved refund.");
      }

      const checkout = await transaction.squareCheckout.findUnique({
        where: { id: record.checkoutId },
      });

      if (!checkout || checkout.entryId !== record.entryId) {
        throw new Error("Refund checkout and entry records do not match.");
      }

      const now = new Date();
      const completedAt = input.refund.status === "COMPLETED" ? now : null;
      const paymentStatus = platformPaymentStatus(input.refund, checkout.amountCents);
      const refundedAmountCents =
        input.refund.status === "COMPLETED" ? input.refund.amountCents : 0;
      const updatedRecord = await transaction.squareRefundRecord.update({
        data: {
          completedAt,
          failureDetail: null,
          squareRefundId: input.refund.id,
          status: input.refund.status,
        },
        where: { id: record.id },
      });

      await transaction.squareCheckout.update({
        data: {
          refundReason: record.reason,
          refundedAmountCents,
          refundedAt: completedAt,
          refundRequestedAt: record.requestedAt,
          refundStatus: input.refund.status,
          squareRefundId: input.refund.id,
          status: paymentStatus,
        },
        where: { id: record.checkoutId },
      });

      await transaction.clubhouseEntryRecord.update({
        data: {
          paymentStatus,
          refundedAmountCents,
          refundedAt: completedAt,
          refundRequestedAt: record.requestedAt,
          refundStatus: input.refund.status,
          squareRefundId: input.refund.id,
        },
        where: { id: record.entryId },
      });

      await transaction.transactionAuditEventRecord.create({
        data: {
          checkoutId: record.checkoutId,
          createdAt: now,
          event:
            input.refund.status === "COMPLETED"
              ? "refund_completed"
              : input.refund.status === "PENDING"
                ? "refund_pending"
                : "refund_failed",
          id: randomUUID(),
          meta: {
            amountCents: input.refund.amountCents,
            auditSource: input.auditSource,
            entryId: record.entryId,
            squareEventId: input.auditEventId ?? "",
            squareRefundId: input.refund.id,
          },
          provider: "square",
          status:
            input.refund.status === "COMPLETED"
              ? "Succeeded"
              : input.refund.status === "PENDING"
                ? "Pending"
                : "Failed",
        },
      });

      return toView(updatedRecord);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function executeClosureSquareRefund(input: {
  entryId: string;
  requestedBy: string;
  reason?: string;
}) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is required for Square refunds.");
  }

  const requestedBy = input.requestedBy.trim();

  if (!requestedBy) {
    throw new Error("An authorized administrator is required.");
  }

  const reservation = await prisma.$transaction(
    async (transaction) => {
      const entry = await transaction.clubhouseEntryRecord.findUnique({
        where: { id: input.entryId },
      });

      if (!entry?.closureRefundEligibleAt) {
        throw new Error("This entry is not approved for closure refund review.");
      }

      if (
        entry.paymentMethod !== "Square" ||
        !entry.squareCheckoutId ||
        !entry.squarePaymentId
      ) {
        throw new Error("This entry does not have a refundable Square payment.");
      }

      const checkout = await transaction.squareCheckout.findUnique({
        where: { id: entry.squareCheckoutId },
      });

      if (
        !checkout ||
        checkout.entryId !== entry.id ||
        checkout.squarePaymentId !== entry.squarePaymentId ||
        checkout.amountCents !== entry.amountCents
      ) {
        throw new Error("Square payment, checkout, and entry records do not match.");
      }

      const existing = await transaction.squareRefundRecord.findUnique({
        where: { entryId: entry.id },
      });

      if (existing) {
        return { checkout, entry, record: existing };
      }

      const reason = (
        input.reason?.trim() ||
        entry.closureRefundReason ||
        "Challenge closed before the paid attempt could be completed."
      ).slice(0, 192);
      const record = await transaction.squareRefundRecord.create({
        data: {
          amountCents: entry.amountCents,
          checkoutId: checkout.id,
          currency: "USD",
          entryId: entry.id,
          idempotencyKey: refundIdempotencyKey(entry.id),
          paymentId: entry.squarePaymentId,
          reason,
          requestedBy,
          status: "REQUESTED",
        },
      });

      await transaction.squareCheckout.update({
        data: {
          refundReason: reason,
          refundRequestedAt: record.requestedAt,
          refundStatus: "REQUESTED",
        },
        where: { id: checkout.id },
      });
      await transaction.clubhouseEntryRecord.update({
        data: {
          refundRequestedAt: record.requestedAt,
          refundStatus: "REQUESTED",
        },
        where: { id: entry.id },
      });
      await transaction.transactionAuditEventRecord.create({
        data: {
          checkoutId: checkout.id,
          event: "refund_requested",
          id: randomUUID(),
          meta: { amountCents: entry.amountCents, entryId: entry.id, requestedBy },
          provider: "square",
          status: "Pending",
        },
      });

      return { checkout, entry, record };
    },
    { isolationLevel: "Serializable" },
  );

  if (
    reservation.record.status === "PENDING" &&
    reservation.record.squareRefundId
  ) {
    const refund = await getSquareRefund({
      refundId: reservation.record.squareRefundId,
    });

    return applySquareRefundState({ auditSource: "admin", refund });
  }

  if (["COMPLETED", "REJECTED"].includes(reservation.record.status)) {
    return toView(reservation.record);
  }

  try {
    const payment = await getSquarePayment({ paymentId: reservation.record.paymentId });

    if (
      !squarePaymentLooksPaid(payment, {
        amountCents: reservation.record.amountCents,
        orderId: reservation.checkout.squareOrderId,
      })
    ) {
      throw new Error("Square does not show the recorded payment as completed and matching this entry.");
    }

    const refund = await refundSquarePayment({
      amountCents: reservation.record.amountCents,
      idempotencyKey: reservation.record.idempotencyKey,
      paymentId: reservation.record.paymentId,
      reason: reservation.record.reason,
    });

    return await applySquareRefundState({ auditSource: "admin", refund });
  } catch (error) {
    const failureDetail =
      error instanceof Error ? error.message : "Square refund execution failed.";

    await prisma.$transaction([
      prisma.squareRefundRecord.update({
        data: { failureDetail, status: "FAILED" },
        where: { id: reservation.record.id },
      }),
      prisma.squareCheckout.update({
        data: { refundStatus: "FAILED" },
        where: { id: reservation.record.checkoutId },
      }),
      prisma.clubhouseEntryRecord.update({
        data: { refundStatus: "FAILED" },
        where: { id: reservation.record.entryId },
      }),
      prisma.transactionAuditEventRecord.create({
        data: {
          checkoutId: reservation.record.checkoutId,
          event: "refund_failed",
          id: randomUUID(),
          meta: { entryId: reservation.record.entryId, failureDetail },
          provider: "square",
          status: "Failed",
        },
      }),
    ]);

    throw new Error(failureDetail);
  }
}

export async function applySquareRefundWebhook(input: {
  refund: SquareRefund;
  eventId?: string;
}) {
  return applySquareRefundState({
    auditEventId: input.eventId,
    auditSource: "webhook",
    refund: input.refund,
  });
}
