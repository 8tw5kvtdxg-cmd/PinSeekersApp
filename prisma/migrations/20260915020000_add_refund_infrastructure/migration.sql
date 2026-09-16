ALTER TABLE "SquareCheckout" ADD COLUMN "refundStatus" TEXT NOT NULL DEFAULT 'None';
ALTER TABLE "SquareCheckout" ADD COLUMN "refundedAmountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SquareCheckout" ADD COLUMN "squarePaidAt" TIMESTAMP(3);
ALTER TABLE "ClubhouseEntryRecord" ADD COLUMN "refundStatus" TEXT NOT NULL DEFAULT 'None';
ALTER TABLE "ClubhouseEntryRecord" ADD COLUMN "refundedAmountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PaymentReconciliationIssue" ADD COLUMN "customerEmail" TEXT;
ALTER TABLE "PaymentReconciliationIssue" ADD COLUMN "customerNotifiedAt" TIMESTAMP(3);

CREATE TABLE "PaymentIssueClaim" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "systemIssueKey" TEXT,
  "checkoutId" TEXT NOT NULL,
  "entryId" TEXT,
  "playerId" TEXT NOT NULL,
  "playerEmail" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "venueName" TEXT,
  "incidentAt" TIMESTAMP(3),
  "narrative" TEXT NOT NULL,
  "evidenceReference" TEXT,
  "lateSubmissionFlag" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "assignedTo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "PaymentIssueClaim_playerId_createdAt_idx" ON "PaymentIssueClaim"("playerId", "createdAt");
CREATE UNIQUE INDEX "PaymentIssueClaim_systemIssueKey_key" ON "PaymentIssueClaim"("systemIssueKey");
CREATE INDEX "PaymentIssueClaim_status_createdAt_idx" ON "PaymentIssueClaim"("status", "createdAt");
CREATE INDEX "PaymentIssueClaim_checkoutId_idx" ON "PaymentIssueClaim"("checkoutId");

CREATE TABLE "PaymentIssueEvidence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "content" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentIssueEvidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "PaymentIssueClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PaymentIssueEvidence_claimId_createdAt_idx" ON "PaymentIssueEvidence"("claimId", "createdAt");

CREATE TABLE "PaymentIssueEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "note" TEXT,
  "customerMessage" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentIssueEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "PaymentIssueClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PaymentIssueEvent_claimId_createdAt_idx" ON "PaymentIssueEvent"("claimId", "createdAt");

CREATE TABLE "PaymentIssueEmailDelivery" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentIssueEmailDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PaymentIssueEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PaymentIssueEmailDelivery_eventId_audience_key" ON "PaymentIssueEmailDelivery"("eventId", "audience");

CREATE TABLE "SquareRefundAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "checkoutId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "providerRefundId" TEXT,
  "providerStatus" TEXT NOT NULL DEFAULT 'Reserved',
  "lastCheckedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SquareRefundAttempt_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "PaymentIssueClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SquareRefundAttempt_claimId_key" ON "SquareRefundAttempt"("claimId");
CREATE UNIQUE INDEX "SquareRefundAttempt_idempotencyKey_key" ON "SquareRefundAttempt"("idempotencyKey");
CREATE UNIQUE INDEX "SquareRefundAttempt_providerRefundId_key" ON "SquareRefundAttempt"("providerRefundId");
CREATE INDEX "SquareRefundAttempt_checkoutId_idx" ON "SquareRefundAttempt"("checkoutId");
CREATE INDEX "SquareRefundAttempt_providerStatus_createdAt_idx" ON "SquareRefundAttempt"("providerStatus", "createdAt");
