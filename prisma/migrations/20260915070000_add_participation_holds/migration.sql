CREATE TABLE "ParticipationHold" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "reason" TEXT NOT NULL,
  "heldById" TEXT NOT NULL,
  "heldByEmail" TEXT NOT NULL,
  "releasedById" TEXT,
  "releasedByEmail" TEXT,
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ParticipationHold_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ParticipationHold_userId_key" ON "ParticipationHold"("userId");
CREATE INDEX "ParticipationHold_status_createdAt_idx" ON "ParticipationHold"("status", "createdAt");

CREATE TABLE "ParticipationHoldEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "holdId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "customerNotifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParticipationHoldEvent_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "ParticipationHold"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ParticipationHoldEvent_holdId_createdAt_idx" ON "ParticipationHoldEvent"("holdId", "createdAt");
