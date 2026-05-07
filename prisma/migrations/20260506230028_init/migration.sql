-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('CLOSEST_TO_PIN', 'LONGEST_DRIVE');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'READY', 'IN_PROGRESS', 'COMPLETED', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PrizeStatus" AS ENUM ('AVAILABLE', 'AWARDED', 'PAID_OUT');

-- CreateEnum
CREATE TYPE "SimulatorProvider" AS ENUM ('TRUGOLF_APOGEE_E6', 'E6_CONNECT', 'FLIGHTSCOPE_E6', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SimulatorSessionStatus" AS ENUM ('CREATED', 'OPERATOR_READY', 'LAUNCHED', 'IN_PROGRESS', 'RESULT_PENDING', 'VERIFIED', 'SYNCED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SimulatorResultSource" AS ENUM ('MANUAL_ENTRY', 'SCREENSHOT', 'CSV_IMPORT', 'LOCAL_AGENT', 'VENDOR_API');

-- CreateEnum
CREATE TYPE "SimulatorResultStatus" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SYNCED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bay" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT',
    "entryFee" INTEGER NOT NULL DEFAULT 2000,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "locationId" TEXT NOT NULL,
    "bayId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "entryNumber" INTEGER,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "bayId" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shot" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "shotNumber" INTEGER NOT NULL,
    "carryYards" DECIMAL(7,2),
    "totalYards" DECIMAL(7,2),
    "distanceToPinInch" DECIMAL(8,2),
    "isHoleInOne" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "enteredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "standings" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prize" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" INTEGER,
    "status" "PrizeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "winnerId" TEXT,
    "awardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulatorDevice" (
    "id" TEXT NOT NULL,
    "provider" "SimulatorProvider" NOT NULL DEFAULT 'TRUGOLF_APOGEE_E6',
    "venueName" TEXT NOT NULL,
    "bayName" TEXT NOT NULL,
    "softwareName" TEXT,
    "softwareVersion" TEXT,
    "launchMonitorModel" TEXT,
    "launchMonitorSerial" TEXT,
    "firmwareVersion" TEXT,
    "operatorPcName" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulatorDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulatorSession" (
    "id" TEXT NOT NULL,
    "pin2WinSessionId" TEXT NOT NULL,
    "provider" "SimulatorProvider" NOT NULL DEFAULT 'TRUGOLF_APOGEE_E6',
    "status" "SimulatorSessionStatus" NOT NULL DEFAULT 'CREATED',
    "challengeType" "ChallengeType" NOT NULL,
    "playerAlias" TEXT,
    "operatorName" TEXT,
    "venueName" TEXT,
    "bayName" TEXT,
    "course" TEXT,
    "hole" INTEGER,
    "teeBox" TEXT,
    "pinLocation" TEXT,
    "attempts" INTEGER,
    "playTimeMinutes" INTEGER,
    "e6SessionName" TEXT,
    "e6SessionId" TEXT,
    "externalSessionId" TEXT,
    "syncEligible" BOOLEAN NOT NULL DEFAULT false,
    "launchInstructions" JSONB,
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "launchedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deviceId" TEXT,
    "locationId" TEXT,
    "bayId" TEXT,
    "challengeId" TEXT,
    "entryId" TEXT,

    CONSTRAINT "SimulatorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulatorResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "source" "SimulatorResultSource" NOT NULL DEFAULT 'MANUAL_ENTRY',
    "status" "SimulatorResultStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "challengeType" "ChallengeType" NOT NULL,
    "playerAlias" TEXT,
    "rawResult" TEXT NOT NULL,
    "resultUnit" TEXT NOT NULL,
    "totalYards" DECIMAL(7,2),
    "distanceToPinInches" DECIMAL(8,2),
    "evidenceUrl" TEXT,
    "verifierName" TEXT,
    "notes" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "SimulatorResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Bay_locationId_name_key" ON "Bay"("locationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_paymentId_key" ON "Entry"("paymentId");

-- CreateIndex
CREATE INDEX "Entry_challengeId_status_idx" ON "Entry"("challengeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Shot_entryId_shotNumber_key" ON "Shot"("entryId", "shotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_challengeId_key" ON "Leaderboard"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeCheckoutSessionId_key" ON "Payment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "SimulatorDevice_provider_venueName_bayName_idx" ON "SimulatorDevice"("provider", "venueName", "bayName");

-- CreateIndex
CREATE UNIQUE INDEX "SimulatorSession_pin2WinSessionId_key" ON "SimulatorSession"("pin2WinSessionId");

-- CreateIndex
CREATE INDEX "SimulatorSession_status_provider_idx" ON "SimulatorSession"("status", "provider");

-- CreateIndex
CREATE INDEX "SimulatorSession_challengeType_createdAt_idx" ON "SimulatorSession"("challengeType", "createdAt");

-- CreateIndex
CREATE INDEX "SimulatorResult_challengeType_status_idx" ON "SimulatorResult"("challengeType", "status");

-- CreateIndex
CREATE INDEX "SimulatorResult_sessionId_createdAt_idx" ON "SimulatorResult"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Bay" ADD CONSTRAINT "Bay_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "Bay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "Bay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatorSession" ADD CONSTRAINT "SimulatorSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "SimulatorDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatorSession" ADD CONSTRAINT "SimulatorSession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatorSession" ADD CONSTRAINT "SimulatorSession_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "Bay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatorSession" ADD CONSTRAINT "SimulatorSession_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatorSession" ADD CONSTRAINT "SimulatorSession_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatorResult" ADD CONSTRAINT "SimulatorResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SimulatorSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
