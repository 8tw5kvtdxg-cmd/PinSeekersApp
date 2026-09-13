CREATE TABLE "AccountConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "acceptanceText" JSONB NOT NULL,
    "documentHashes" JSONB NOT NULL,
    "combinedDocumentHash" TEXT NOT NULL,
    "legalDocumentsAccepted" BOOLEAN NOT NULL,
    "age18Accepted" BOOLEAN NOT NULL,
    "texasResidencyAccepted" BOOLEAN NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AccountConsentRecord_userId_acceptedAt_idx"
ON "AccountConsentRecord"("userId", "acceptedAt");

CREATE INDEX "AccountConsentRecord_documentVersion_acceptedAt_idx"
ON "AccountConsentRecord"("documentVersion", "acceptedAt");

ALTER TABLE "AccountConsentRecord"
ADD CONSTRAINT "AccountConsentRecord_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
