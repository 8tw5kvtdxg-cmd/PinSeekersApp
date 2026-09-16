CREATE TABLE "PrivacyRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "requestType" TEXT NOT NULL,
  "relatedRequestId" TEXT,
  "detail" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Received',
  "identityStatus" TEXT NOT NULL DEFAULT 'Account Verified',
  "dueAt" TIMESTAMP(3) NOT NULL,
  "extensionReason" TEXT,
  "extendedAt" TIMESTAMP(3),
  "decision" TEXT,
  "response" TEXT,
  "fulfillmentReference" TEXT,
  "handledById" TEXT,
  "handledByEmail" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrivacyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PrivacyRequest_userId_createdAt_idx" ON "PrivacyRequest"("userId", "createdAt");
CREATE INDEX "PrivacyRequest_status_dueAt_idx" ON "PrivacyRequest"("status", "dueAt");

CREATE TABLE "PrivacyRequestEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "note" TEXT,
  "customerText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrivacyRequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PrivacyRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PrivacyRequestEvent_requestId_createdAt_idx" ON "PrivacyRequestEvent"("requestId", "createdAt");

CREATE TABLE "PrivacyRequestEmailDelivery" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrivacyRequestEmailDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PrivacyRequestEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PrivacyRequestEmailDelivery_eventId_audience_key" ON "PrivacyRequestEmailDelivery"("eventId", "audience");
