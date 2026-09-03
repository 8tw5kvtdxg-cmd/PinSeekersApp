CREATE TABLE "TransactionAuditEventRecord" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionAuditEventRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TransactionAuditEventRecord_checkoutId_createdAt_idx"
ON "TransactionAuditEventRecord"("checkoutId", "createdAt");

CREATE INDEX "TransactionAuditEventRecord_event_createdAt_idx"
ON "TransactionAuditEventRecord"("event", "createdAt");
