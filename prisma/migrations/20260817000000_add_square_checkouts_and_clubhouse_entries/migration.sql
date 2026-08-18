CREATE TABLE "SquareCheckout" (
    "id" TEXT NOT NULL,
    "playerEmail" TEXT NOT NULL,
    "challengeSlug" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "e6DisplayName" TEXT NOT NULL,
    "locationSlug" TEXT,
    "locationName" TEXT,
    "bayName" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "squareOrderId" TEXT NOT NULL,
    "squarePaymentLinkId" TEXT,
    "squarePaymentLinkUrl" TEXT NOT NULL,
    "squarePaymentId" TEXT,
    "entryId" TEXT,
    "confirmationEmailSentAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquareCheckout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClubhouseEntryRecord" (
    "id" TEXT NOT NULL,
    "challengeSlug" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerEmail" TEXT,
    "phoneNumber" TEXT,
    "e6DisplayName" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paidAt" TEXT NOT NULL,
    "validFrom" TEXT NOT NULL,
    "validUntil" TEXT NOT NULL,
    "attemptLimit" INTEGER NOT NULL,
    "resultStatus" TEXT NOT NULL,
    "result" TEXT,
    "resultValue" DOUBLE PRECISION,
    "resultUnit" TEXT,
    "evidence" TEXT,
    "e6EventCode" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "payarcCheckoutId" TEXT,
    "payarcOrderId" TEXT,
    "squareCheckoutId" TEXT,
    "squareOrderId" TEXT,
    "squarePaymentId" TEXT,
    "venueBookingReference" TEXT,
    "bookingVerificationId" TEXT,
    "bookingVerificationStatus" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "locationSlug" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "bayName" TEXT,
    "amountCents" INTEGER NOT NULL,
    "adminConfirmedAt" TEXT,
    "adminConfirmedBy" TEXT,
    "entryDecisionStatus" TEXT,
    "entryDecisionAt" TEXT,
    "entryDecisionBy" TEXT,
    "entryDecisionEmailSentAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubhouseEntryRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SquareCheckout_squareOrderId_key" ON "SquareCheckout"("squareOrderId");
CREATE INDEX "SquareCheckout_playerEmail_createdAt_idx" ON "SquareCheckout"("playerEmail", "createdAt");
CREATE INDEX "SquareCheckout_status_createdAt_idx" ON "SquareCheckout"("status", "createdAt");
CREATE UNIQUE INDEX "ClubhouseEntryRecord_stripeCheckoutSessionId_key" ON "ClubhouseEntryRecord"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "ClubhouseEntryRecord_payarcCheckoutId_key" ON "ClubhouseEntryRecord"("payarcCheckoutId");
CREATE UNIQUE INDEX "ClubhouseEntryRecord_squareCheckoutId_key" ON "ClubhouseEntryRecord"("squareCheckoutId");
CREATE INDEX "ClubhouseEntryRecord_challengeSlug_createdAt_idx" ON "ClubhouseEntryRecord"("challengeSlug", "createdAt");
CREATE INDEX "ClubhouseEntryRecord_locationSlug_createdAt_idx" ON "ClubhouseEntryRecord"("locationSlug", "createdAt");
CREATE INDEX "ClubhouseEntryRecord_paymentStatus_createdAt_idx" ON "ClubhouseEntryRecord"("paymentStatus", "createdAt");
CREATE INDEX "ClubhouseEntryRecord_entryDecisionStatus_createdAt_idx" ON "ClubhouseEntryRecord"("entryDecisionStatus", "createdAt");
