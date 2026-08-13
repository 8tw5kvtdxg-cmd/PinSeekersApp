CREATE TABLE "BookingVerification" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "locationSlug" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "bayName" TEXT,
    "productName" TEXT NOT NULL,
    "reservationStartsAt" TIMESTAMP(3) NOT NULL,
    "reservationEndsAt" TIMESTAMP(3),
    "amountCents" INTEGER,
    "source" TEXT NOT NULL,
    "externalReference" TEXT,
    "rawEmailSubject" TEXT,
    "rawEmailText" TEXT,
    "status" TEXT NOT NULL,
    "matchedEntryId" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingVerification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingVerification_locationSlug_reservationStartsAt_idx" ON "BookingVerification"("locationSlug", "reservationStartsAt");
CREATE INDEX "BookingVerification_customerEmail_reservationStartsAt_idx" ON "BookingVerification"("customerEmail", "reservationStartsAt");
CREATE INDEX "BookingVerification_status_reservationStartsAt_idx" ON "BookingVerification"("status", "reservationStartsAt");
CREATE INDEX "BookingVerification_createdAt_idx" ON "BookingVerification"("createdAt");
