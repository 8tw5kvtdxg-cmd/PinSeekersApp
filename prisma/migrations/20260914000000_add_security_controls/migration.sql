CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "absoluteExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminLoginChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLoginChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SecurityRateLimitBucket" (
    "key" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityRateLimitBucket_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "ClubhouseEntryRecord"
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedBy" TEXT,
ADD COLUMN "archiveReason" TEXT;

CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
CREATE INDEX "AdminSession_absoluteExpiresAt_idx" ON "AdminSession"("absoluteExpiresAt");
CREATE INDEX "AdminLoginChallenge_userId_expiresAt_idx" ON "AdminLoginChallenge"("userId", "expiresAt");
CREATE INDEX "AdminLoginChallenge_expiresAt_usedAt_idx" ON "AdminLoginChallenge"("expiresAt", "usedAt");
CREATE INDEX "SecurityRateLimitBucket_namespace_expiresAt_idx" ON "SecurityRateLimitBucket"("namespace", "expiresAt");
CREATE INDEX "SecurityRateLimitBucket_expiresAt_idx" ON "SecurityRateLimitBucket"("expiresAt");
CREATE INDEX "ClubhouseEntryRecord_archivedAt_createdAt_idx" ON "ClubhouseEntryRecord"("archivedAt", "createdAt");

ALTER TABLE "AdminSession"
ADD CONSTRAINT "AdminSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminLoginChallenge"
ADD CONSTRAINT "AdminLoginChallenge_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
