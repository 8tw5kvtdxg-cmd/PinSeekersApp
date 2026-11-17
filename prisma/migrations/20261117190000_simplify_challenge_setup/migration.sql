ALTER TABLE "ClubhouseChallengeSetting" ADD COLUMN "neverCloses" BOOLEAN NOT NULL DEFAULT false;
UPDATE "ClubhouseChallengeSetting" SET "salesState" = 'Closed' WHERE "challengeSlug" = 'alamo-hole-in-one-challenge';
ALTER TABLE "Location" ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;
UPDATE "Location" SET "isActive" = false, archived = true WHERE lower(trim(name)) IN ('dead solid perfect', 'dead solid perfect - dsp') OR slug IN ('dead-solid-perfect', 'dead-solid-perfect-dsp');
