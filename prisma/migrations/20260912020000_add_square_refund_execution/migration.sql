ALTER TABLE "SquareCheckout"
ADD COLUMN "refundStatus" TEXT,
ADD COLUMN "refundedAmountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "squareRefundId" TEXT,
ADD COLUMN "refundReason" TEXT,
ADD COLUMN "refundRequestedAt" TIMESTAMP(3),
ADD COLUMN "refundedAt" TIMESTAMP(3);

ALTER TABLE "ClubhouseEntryRecord"
ADD COLUMN "refundStatus" TEXT,
ADD COLUMN "refundedAmountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "squareRefundId" TEXT,
ADD COLUMN "refundRequestedAt" TIMESTAMP(3),
ADD COLUMN "refundedAt" TIMESTAMP(3);

CREATE TABLE "SquareRefundRecord" (
  "id" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "checkoutId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "squareRefundId" TEXT,
  "requestedBy" TEXT NOT NULL,
  "failureDetail" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SquareRefundRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SquareRefundRecord_entryId_key" ON "SquareRefundRecord"("entryId");
CREATE UNIQUE INDEX "SquareRefundRecord_idempotencyKey_key" ON "SquareRefundRecord"("idempotencyKey");
CREATE UNIQUE INDEX "SquareRefundRecord_squareRefundId_key" ON "SquareRefundRecord"("squareRefundId");
CREATE INDEX "SquareRefundRecord_checkoutId_createdAt_idx" ON "SquareRefundRecord"("checkoutId", "createdAt");
CREATE INDEX "SquareRefundRecord_paymentId_createdAt_idx" ON "SquareRefundRecord"("paymentId", "createdAt");
CREATE INDEX "SquareRefundRecord_status_createdAt_idx" ON "SquareRefundRecord"("status", "createdAt");
CREATE INDEX "ClubhouseEntryRecord_refundStatus_createdAt_idx" ON "ClubhouseEntryRecord"("refundStatus", "createdAt");
