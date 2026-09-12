ALTER TABLE "ClubhouseEntryRecord"
ADD COLUMN "isHoleInOne" BOOLEAN,
ADD COLUMN "simulatorSessionId" TEXT,
ADD COLUMN "simulatorShotId" TEXT,
ADD COLUMN "resultOccurredAt" TIMESTAMP(3),
ADD COLUMN "resultSource" TEXT,
ADD COLUMN "resultSourceMetadata" JSONB,
ADD COLUMN "resultVerifiedAt" TIMESTAMP(3),
ADD COLUMN "resultVerifiedBy" TEXT,
ADD COLUMN "resultVerificationNote" TEXT,
ADD COLUMN "closureRefundEligibleAt" TIMESTAMP(3),
ADD COLUMN "closureRefundReason" TEXT;

ALTER TABLE "ClubhouseChallengeSetting"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "potentialWinnerReportedAt" TIMESTAMP(3),
ADD COLUMN "pausedAt" TIMESTAMP(3),
ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "winnerEntryIds" JSONB,
ADD COLUMN "winnerSelectedAt" TIMESTAMP(3),
ADD COLUMN "closureReason" TEXT;

CREATE TABLE "HoleInOneVerificationEvent" (
  "id" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "challengeSlug" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorType" TEXT NOT NULL,
  "actorIdentifier" TEXT,
  "isHoleInOne" BOOLEAN,
  "resultOccurredAt" TIMESTAMP(3),
  "evidence" TEXT,
  "sourceMetadata" JSONB,
  "verificationNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HoleInOneVerificationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClubhouseEntryRecord_challengeSlug_isHoleInOne_resultStatus_resultOccurredAt_idx"
ON "ClubhouseEntryRecord"("challengeSlug", "isHoleInOne", "resultStatus", "resultOccurredAt");

CREATE INDEX "ClubhouseEntryRecord_closureRefundEligibleAt_idx"
ON "ClubhouseEntryRecord"("closureRefundEligibleAt");

CREATE INDEX "HoleInOneVerificationEvent_entryId_createdAt_idx"
ON "HoleInOneVerificationEvent"("entryId", "createdAt");

CREATE INDEX "HoleInOneVerificationEvent_challengeSlug_createdAt_idx"
ON "HoleInOneVerificationEvent"("challengeSlug", "createdAt");

CREATE INDEX "HoleInOneVerificationEvent_action_createdAt_idx"
ON "HoleInOneVerificationEvent"("action", "createdAt");
