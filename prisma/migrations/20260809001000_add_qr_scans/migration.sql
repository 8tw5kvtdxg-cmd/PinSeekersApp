CREATE TABLE "QrScan" (
    "id" TEXT NOT NULL,
    "challengeSlug" TEXT NOT NULL,
    "locationSlug" TEXT NOT NULL,
    "bayName" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrScan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QrScan_locationSlug_createdAt_idx" ON "QrScan"("locationSlug", "createdAt");
CREATE INDEX "QrScan_challengeSlug_createdAt_idx" ON "QrScan"("challengeSlug", "createdAt");
CREATE INDEX "QrScan_createdAt_idx" ON "QrScan"("createdAt");
