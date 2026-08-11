ALTER TABLE "QrScan" ADD COLUMN "bookingMatchStatus" TEXT;
ALTER TABLE "QrScan" ADD COLUMN "bookingVerificationId" TEXT;

CREATE INDEX "QrScan_bookingMatchStatus_createdAt_idx" ON "QrScan"("bookingMatchStatus", "createdAt");
