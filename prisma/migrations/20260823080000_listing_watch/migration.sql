CREATE TABLE "ListingWatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "phrase" TEXT,
    "phraseNorm" TEXT,
    "targetUserId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingWatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ListingWatch_userId_kind_idx" ON "ListingWatch"("userId", "kind");
CREATE INDEX "ListingWatch_targetUserId_enabled_idx" ON "ListingWatch"("targetUserId", "enabled");
CREATE INDEX "ListingWatch_kind_enabled_idx" ON "ListingWatch"("kind", "enabled");

CREATE UNIQUE INDEX "ListingWatch_userId_phraseNorm_phrase_key" ON "ListingWatch"("userId", "phraseNorm") WHERE "kind" = 'phrase' AND "phraseNorm" IS NOT NULL;
CREATE UNIQUE INDEX "ListingWatch_userId_targetUserId_person_key" ON "ListingWatch"("userId", "targetUserId") WHERE "kind" = 'person' AND "targetUserId" IS NOT NULL;

ALTER TABLE "ListingWatch" ADD CONSTRAINT "ListingWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingWatch" ADD CONSTRAINT "ListingWatch_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SystemNotice" ADD COLUMN IF NOT EXISTS "listingId" TEXT;
ALTER TABLE "SystemNotice" ADD COLUMN IF NOT EXISTS "watchId" TEXT;

CREATE INDEX "SystemNotice_userId_kind_watchId_createdAt_idx" ON "SystemNotice"("userId", "kind", "watchId", "createdAt");
