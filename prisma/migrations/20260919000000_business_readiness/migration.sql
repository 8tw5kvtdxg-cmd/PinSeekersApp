ALTER TABLE "EmailVerificationToken" ADD COLUMN "returnTo" TEXT;
-- Historical signup timestamps were not mailbox-ownership evidence. Preserve
-- only accounts with a consumed verification token for their current address.
UPDATE "User" u SET "emailVerifiedAt" = NULL
WHERE "emailVerifiedAt" IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM "EmailVerificationToken" t
  WHERE t."userId" = u.id AND lower(t.email) = lower(u.email) AND t."usedAt" IS NOT NULL
);
ALTER TABLE "ClubhouseChallengeSetting"
 ALTER COLUMN "salesState" SET DEFAULT 'Draft',
 ADD COLUMN "courseName" TEXT,
 ADD COLUMN "holeNumber" INTEGER,
 ADD COLUMN "teeName" TEXT,
 ADD COLUMN "pinPosition" TEXT,
 ADD COLUMN "distanceYards" INTEGER,
 ADD COLUMN "simulatorSettings" TEXT,
 ADD COLUMN "readinessReference" TEXT,
 ADD COLUMN "prizeFundingConfirmed" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "evidenceReady" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "rehearsalCompleted" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "approvedByEmail" TEXT,
 ADD COLUMN "approvedAt" TIMESTAMP(3);
UPDATE "ClubhouseChallengeSetting" SET "salesState" = 'Draft' WHERE "salesState" = 'Open';
CREATE TABLE "ClubhouseChallengeBay" (
 "challengeSlug" TEXT NOT NULL, "bayId" TEXT NOT NULL,
 PRIMARY KEY ("challengeSlug", "bayId"),
 CONSTRAINT "ClubhouseChallengeBay_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "Bay"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Move the existing public listing into the managed source, preserving all
-- existing records (including inactive locations and changed URLs).
INSERT INTO "Location" (id,name,slug,address,city,state,"websiteUrl","bookingUrl","updatedAt")
VALUES ('pin2win-alamo-golf-den','Alamo Golf Den','alamo-golf-den','7001 I-10 #225','San Antonio','TX 78213','https://alamogolfden.com','https://alamogolfden.golf918.net/embed/y1snhpyhqamwoh5xo4lml',CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE "BookingVisitOutcome" ("bookingId" TEXT PRIMARY KEY, "status" TEXT NOT NULL, "evidence" TEXT NOT NULL, "acquisitionSource" TEXT NOT NULL DEFAULT 'Unknown', "updatedByEmail" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "BookingVisitOutcomeAudit" ("id" TEXT PRIMARY KEY, "bookingId" TEXT NOT NULL, "status" TEXT NOT NULL, "evidence" TEXT NOT NULL, "acquisitionSource" TEXT NOT NULL, "actorEmail" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "BookingVisitOutcomeAudit_bookingId_createdAt_idx" ON "BookingVisitOutcomeAudit"("bookingId", "createdAt");
