-- Attribute payment records to partner locations for accounting exports.
ALTER TABLE "Payment" ADD COLUMN "locationId" TEXT;

CREATE INDEX "Payment_locationId_createdAt_idx"
  ON "Payment"("locationId", "createdAt");

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
