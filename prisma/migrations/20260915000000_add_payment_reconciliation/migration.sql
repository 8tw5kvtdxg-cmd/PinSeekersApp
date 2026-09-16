ALTER TABLE "SquareCheckout" ADD COLUMN "reconciledAt" TIMESTAMP(3);
ALTER TABLE "SquareCheckout" ADD COLUMN "staffEmailSentAt" TIMESTAMP(3);
ALTER TABLE "SquareCheckout" ADD COLUMN "playerEmailSentAt" TIMESTAMP(3);
ALTER TABLE "ClubhouseEntryRecord" ADD COLUMN "paymentReconciledAt" TIMESTAMP(3);

CREATE TABLE "PaymentReconciliationIssue" (
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "checkoutId" TEXT,
    "entryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "detail" TEXT NOT NULL,
    "lastAlertedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentReconciliationIssue_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "SquareCheckout_reconciledAt_createdAt_idx" ON "SquareCheckout"("reconciledAt", "createdAt");
CREATE INDEX "ClubhouseEntryRecord_paymentReconciledAt_createdAt_idx" ON "ClubhouseEntryRecord"("paymentReconciledAt", "createdAt");
CREATE INDEX "PaymentReconciliationIssue_status_createdAt_idx" ON "PaymentReconciliationIssue"("status", "createdAt");
CREATE INDEX "PaymentReconciliationIssue_checkoutId_idx" ON "PaymentReconciliationIssue"("checkoutId");
CREATE INDEX "PaymentReconciliationIssue_entryId_idx" ON "PaymentReconciliationIssue"("entryId");
