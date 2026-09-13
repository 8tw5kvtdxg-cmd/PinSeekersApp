CREATE TABLE "LegalAcceptanceRecord" (
  "id" TEXT NOT NULL,
  "checkoutId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userEmail" TEXT NOT NULL,
  "challengeSlug" TEXT NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "acceptanceText" JSONB NOT NULL,
  "documentHashes" JSONB NOT NULL,
  "combinedDocumentHash" TEXT NOT NULL,
  "legalDocumentsAccepted" BOOLEAN NOT NULL,
  "age18Accepted" BOOLEAN NOT NULL,
  "texasResidencyAccepted" BOOLEAN NOT NULL,
  "onsitePresenceAccepted" BOOLEAN NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "locationSlug" TEXT,
  "bayName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalAcceptanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegalAcceptanceRecord_checkoutId_key" ON "LegalAcceptanceRecord"("checkoutId");
CREATE INDEX "LegalAcceptanceRecord_userId_acceptedAt_idx" ON "LegalAcceptanceRecord"("userId", "acceptedAt");
CREATE INDEX "LegalAcceptanceRecord_challengeSlug_acceptedAt_idx" ON "LegalAcceptanceRecord"("challengeSlug", "acceptedAt");
CREATE INDEX "LegalAcceptanceRecord_documentVersion_acceptedAt_idx" ON "LegalAcceptanceRecord"("documentVersion", "acceptedAt");
