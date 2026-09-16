ALTER TABLE "ClubhouseChallengeSetting"
ADD COLUMN "salesState" TEXT NOT NULL DEFAULT 'Open',
ADD COLUMN "salesHoldReason" TEXT,
ADD COLUMN "salesHeldAt" TIMESTAMP(3);

CREATE TABLE "HoleInOneReport" (
    "id" TEXT NOT NULL,
    "challengeSlug" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending Review',
    "reportSource" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "playerStatement" TEXT,
    "evidenceReference" TEXT,
    "simulatorProvider" TEXT,
    "simulatorSessionId" TEXT,
    "simulatorShotId" TEXT,
    "simulatorAlias" TEXT,
    "simulatorVenue" TEXT,
    "simulatorBay" TEXT,
    "strokeCount" INTEGER,
    "ballHoled" BOOLEAN,
    "designatedTee" BOOLEAN,
    "shotAt" TIMESTAMP(3),
    "timestampReliable" BOOLEAN,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HoleInOneReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HoleInOneReviewEvent" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HoleInOneReviewEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WinnerChronology" (
    "challengeSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'No Verified Result',
    "provisionalReportId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WinnerChronology_pkey" PRIMARY KEY ("challengeSlug")
);

CREATE UNIQUE INDEX "HoleInOneReport_entryId_key" ON "HoleInOneReport"("entryId");
CREATE UNIQUE INDEX "HoleInOneReport_simulatorProvider_simulatorShotId_key" ON "HoleInOneReport"("simulatorProvider", "simulatorShotId");
CREATE INDEX "HoleInOneReport_challengeSlug_status_shotAt_idx" ON "HoleInOneReport"("challengeSlug", "status", "shotAt");
CREATE INDEX "HoleInOneReviewEvent_reportId_createdAt_idx" ON "HoleInOneReviewEvent"("reportId", "createdAt");

ALTER TABLE "HoleInOneReport"
ADD CONSTRAINT "HoleInOneReport_entryId_fkey"
FOREIGN KEY ("entryId") REFERENCES "ClubhouseEntryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HoleInOneReviewEvent"
ADD CONSTRAINT "HoleInOneReviewEvent_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "HoleInOneReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
