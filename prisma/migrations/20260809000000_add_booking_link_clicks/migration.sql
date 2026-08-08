CREATE TABLE "BookingLinkClick" (
    "id" TEXT NOT NULL,
    "locationId" TEXT,
    "locationSlug" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "bookingUrl" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingLinkClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingLinkClick_locationSlug_createdAt_idx" ON "BookingLinkClick"("locationSlug", "createdAt");
CREATE INDEX "BookingLinkClick_createdAt_idx" ON "BookingLinkClick"("createdAt");
