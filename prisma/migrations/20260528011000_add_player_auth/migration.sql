-- Add player account auth fields.
-- Defaults keep this migration safe if existing local test users already exist.
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

UPDATE "User"
SET
  "username" = COALESCE("username", "email"),
  "passwordHash" = COALESCE("passwordHash", 'legacy-password-reset-required');

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
