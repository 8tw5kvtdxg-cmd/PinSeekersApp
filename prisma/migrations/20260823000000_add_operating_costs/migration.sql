CREATE TABLE "OperatingCost" (
    "id" TEXT NOT NULL,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "account" TEXT,
    "isDeductible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingCost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperatingCost_incurredAt_idx" ON "OperatingCost"("incurredAt");
CREATE INDEX "OperatingCost_category_incurredAt_idx" ON "OperatingCost"("category", "incurredAt");
CREATE INDEX "OperatingCost_isDeductible_incurredAt_idx" ON "OperatingCost"("isDeductible", "incurredAt");
