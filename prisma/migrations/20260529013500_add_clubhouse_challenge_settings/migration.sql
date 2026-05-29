CREATE TABLE "ClubhouseChallengeSetting" (
    "id" TEXT NOT NULL,
    "challengeSlug" TEXT NOT NULL,
    "e6EventCode" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubhouseChallengeSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClubhouseChallengeSetting_challengeSlug_key" ON "ClubhouseChallengeSetting"("challengeSlug");
