import { randomUUID } from "node:crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { canTransitionCheckoutStatus } from "@/lib/checkout-status";
import { getPrismaClient } from "@/lib/prisma";

export type SquareCheckoutStatus = "Pending" | "Succeeded" | "Failed";

export type SquareCheckoutRecord = {
  id: string;
  playerEmail: string;
  challengeSlug: string;
  playerName: string;
  phoneNumber: string;
  e6DisplayName: string;
  locationSlug?: string;
  locationName?: string;
  bayName?: string;
  amountCents: number;
  status: SquareCheckoutStatus;
  squareOrderId: string;
  squarePaymentLinkId?: string;
  squarePaymentLinkUrl: string;
  squarePaymentId?: string;
  squarePaidAt?: string;
  acceptedConsentRecordId?: string;
  acceptedDocumentVersion?: string;
  acceptedPackageHash?: string;
  entryId?: string;
  refundStatus?: string;
  refundedAmountCents?: number;
  accessRevealedAt?: string;
  confirmationEmailSentAt?: string;
  staffEmailSentAt?: string;
  playerEmailSentAt?: string;
  createdAt: string;
  updatedAt: string;
};

export function nextSquareCheckoutId() {
  return `P2W-SQUARE-${randomUUID()}`;
}

function toSquareCheckoutRecord(checkout: {
  id: string;
  playerEmail: string;
  challengeSlug: string;
  playerName: string;
  phoneNumber: string;
  e6DisplayName: string;
  locationSlug: string | null;
  locationName: string | null;
  bayName: string | null;
  amountCents: number;
  status: string;
  squareOrderId: string;
  squarePaymentLinkId: string | null;
  squarePaymentLinkUrl: string;
  squarePaymentId: string | null;
  squarePaidAt: Date | null;
  acceptedConsentRecordId: string | null;
  acceptedDocumentVersion: string | null;
  acceptedPackageHash: string | null;
  entryId: string | null;
  refundStatus: string;
  refundedAmountCents: number;
  accessRevealedAt: Date | null;
  confirmationEmailSentAt: string | null;
  staffEmailSentAt: Date | null;
  playerEmailSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SquareCheckoutRecord {
  return {
    id: checkout.id,
    playerEmail: checkout.playerEmail,
    challengeSlug: checkout.challengeSlug,
    playerName: checkout.playerName,
    phoneNumber: checkout.phoneNumber,
    e6DisplayName: checkout.e6DisplayName,
    locationSlug: checkout.locationSlug ?? undefined,
    locationName: checkout.locationName ?? undefined,
    bayName: checkout.bayName ?? undefined,
    amountCents: checkout.amountCents,
    status: checkout.status as SquareCheckoutStatus,
    squareOrderId: checkout.squareOrderId,
    squarePaymentLinkId: checkout.squarePaymentLinkId ?? undefined,
    squarePaymentLinkUrl: checkout.squarePaymentLinkUrl,
    squarePaymentId: checkout.squarePaymentId ?? undefined,
    squarePaidAt: checkout.squarePaidAt?.toISOString(),
    acceptedConsentRecordId: checkout.acceptedConsentRecordId ?? undefined,
    acceptedDocumentVersion: checkout.acceptedDocumentVersion ?? undefined,
    acceptedPackageHash: checkout.acceptedPackageHash ?? undefined,
    entryId: checkout.entryId ?? undefined,
    refundStatus: checkout.refundStatus,
    refundedAmountCents: checkout.refundedAmountCents,
    accessRevealedAt: checkout.accessRevealedAt?.toISOString(),
    confirmationEmailSentAt: checkout.confirmationEmailSentAt ?? undefined,
    staffEmailSentAt: checkout.staffEmailSentAt?.toISOString(),
    playerEmailSentAt: checkout.playerEmailSentAt?.toISOString(),
    createdAt: checkout.createdAt.toISOString(),
    updatedAt: checkout.updatedAt.toISOString(),
  };
}

export async function getSquareCheckoutRecord(checkoutId: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is required for Square checkout.");
  }

  const checkout = await prisma.squareCheckout.findUnique({
    where: { id: checkoutId },
  });

  return checkout ? toSquareCheckoutRecord(checkout) : null;
}

export async function getSquareCheckoutRecordByOrderId(squareOrderId: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is required for Square checkout.");
  }

  const checkout = await prisma.squareCheckout.findUnique({
    where: { squareOrderId },
  });

  return checkout ? toSquareCheckoutRecord(checkout) : null;
}

export async function createSquareCheckoutRecord(
  input: Omit<SquareCheckoutRecord, "status" | "createdAt" | "updatedAt">,
) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is required for Square checkout.");
  }

  const now = new Date();
  const checkout = await prisma.$transaction(async (tx) => {
    const setting = await tx.clubhouseChallengeSetting.findUnique({
      where: { challengeSlug: input.challengeSlug }, select: { salesState: true },
    });
    if (setting?.salesState && setting.salesState !== "Open") {
      throw new Error("This challenge is paused or closed to new entries.");
    }
    return tx.squareCheckout.create({
      data: {
        ...input,
        status: "Pending",
        createdAt: now,
        updatedAt: now,
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return toSquareCheckoutRecord(checkout);
}

export async function updateSquareCheckoutRecord(
  checkoutId: string,
  patch: Partial<
    Pick<
      SquareCheckoutRecord,
      | "status"
      | "squarePaymentId"
      | "squarePaidAt"
      | "entryId"
      | "accessRevealedAt"
      | "confirmationEmailSentAt"
      | "staffEmailSentAt"
      | "playerEmailSentAt"
    >
  >,
) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is required for Square checkout.");
  }

  const existing = await prisma.squareCheckout.findUnique({
    where: { id: checkoutId },
  });

  if (!existing) {
    throw new Error("Square checkout was not found.");
  }

  const currentStatus = existing.status as SquareCheckoutStatus;
  const nextStatus = patch.status as SquareCheckoutStatus | undefined;

  if (nextStatus && !canTransitionCheckoutStatus(currentStatus, nextStatus)) {
    return toSquareCheckoutRecord(existing);
  }

  const checkout = await prisma.squareCheckout.update({
    data: {
      ...patch,
      squarePaidAt: patch.squarePaidAt && !existing.squarePaidAt ? new Date(patch.squarePaidAt) : undefined,
      updatedAt: new Date(),
    },
    where: { id: checkoutId },
  });

  return toSquareCheckoutRecord(checkout);
}

export async function getOrStartSquareCheckoutAccess(checkoutId: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is required for Square checkout.");
  }

  const now = new Date();

  await prisma.squareCheckout.updateMany({
    data: { accessRevealedAt: now },
    where: { id: checkoutId, accessRevealedAt: null, refundStatus: { notIn: ["Refund Requested", "Refund Pending", "Refunded"] } },
  });

  const checkout = await prisma.squareCheckout.findUnique({
    select: { accessRevealedAt: true, refundStatus: true },
    where: { id: checkoutId },
  });

  if (checkout && ["Refund Requested", "Refund Pending", "Refunded"].includes(checkout.refundStatus)) {
    throw new Error("Event code access is paused while this payment is being refunded.");
  }
  if (!checkout?.accessRevealedAt) {
    throw new Error("Square checkout access could not be started.");
  }

  return checkout.accessRevealedAt.toISOString();
}
