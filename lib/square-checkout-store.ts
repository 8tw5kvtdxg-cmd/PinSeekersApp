import { randomUUID } from "node:crypto";
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
  entryId?: string;
  accessRevealedAt?: string;
  confirmationEmailSentAt?: string;
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
  entryId: string | null;
  accessRevealedAt: Date | null;
  confirmationEmailSentAt: string | null;
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
    entryId: checkout.entryId ?? undefined,
    accessRevealedAt: checkout.accessRevealedAt?.toISOString(),
    confirmationEmailSentAt: checkout.confirmationEmailSentAt ?? undefined,
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
  const checkout = await prisma.squareCheckout.create({
    data: {
      ...input,
      status: "Pending",
      createdAt: now,
      updatedAt: now,
    },
  });

  return toSquareCheckoutRecord(checkout);
}

export async function updateSquareCheckoutRecord(
  checkoutId: string,
  patch: Partial<
    Pick<
      SquareCheckoutRecord,
      | "status"
      | "squarePaymentId"
      | "entryId"
      | "accessRevealedAt"
      | "confirmationEmailSentAt"
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
    where: { id: checkoutId, accessRevealedAt: null },
  });

  const checkout = await prisma.squareCheckout.findUnique({
    select: { accessRevealedAt: true },
    where: { id: checkoutId },
  });

  if (!checkout?.accessRevealedAt) {
    throw new Error("Square checkout access could not be started.");
  }

  return checkout.accessRevealedAt.toISOString();
}
