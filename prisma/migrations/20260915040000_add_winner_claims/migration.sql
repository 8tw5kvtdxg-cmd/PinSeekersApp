CREATE TABLE "WinnerClaim" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reportId" TEXT NOT NULL,
  "challengeSlug" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "playerEmail" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Potential Winner',
  "noticeSentAt" TIMESTAMP(3),
  "responseDueAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "responseStatus" TEXT NOT NULL DEFAULT 'Awaiting',
  "eligibilityStatus" TEXT NOT NULL DEFAULT 'Pending',
  "identityStatus" TEXT NOT NULL DEFAULT 'Not received',
  "residencyStatus" TEXT NOT NULL DEFAULT 'Not received',
  "affidavitStatus" TEXT NOT NULL DEFAULT 'Not received',
  "w9Status" TEXT NOT NULL DEFAULT 'Not received',
  "secureCollectionMethod" TEXT,
  "finalizedAt" TIMESTAMP(3),
  "payoutTargetAt" TIMESTAMP(3),
  "payoutApprovedAt" TIMESTAMP(3),
  "payoutApprovedBy" TEXT,
  "payoutAmountCents" INTEGER,
  "paidAt" TIMESTAMP(3),
  "payoutMethod" TEXT,
  "taxFormStatus" TEXT NOT NULL DEFAULT 'CPA review pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WinnerClaim_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "HoleInOneReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WinnerClaim_reportId_key" ON "WinnerClaim"("reportId");
CREATE INDEX "WinnerClaim_challengeSlug_status_idx" ON "WinnerClaim"("challengeSlug", "status");
CREATE INDEX "WinnerClaim_responseDueAt_idx" ON "WinnerClaim"("responseDueAt");

CREATE TABLE "WinnerClaimEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WinnerClaimEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "WinnerClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "WinnerClaimEvent_claimId_createdAt_idx" ON "WinnerClaimEvent"("claimId", "createdAt");
