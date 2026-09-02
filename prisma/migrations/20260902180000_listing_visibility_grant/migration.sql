-- CreateTable
CREATE TABLE "ListingVisibilityGrant" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'forward',
    "listingId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingVisibilityGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingVisibilityGrant_listingId_granteeId_sourceId_key" ON "ListingVisibilityGrant"("listingId", "granteeId", "sourceId");

-- CreateIndex
CREATE INDEX "ListingVisibilityGrant_granteeId_sellerId_idx" ON "ListingVisibilityGrant"("granteeId", "sellerId");

-- CreateIndex
CREATE INDEX "ListingVisibilityGrant_granteeId_listingId_idx" ON "ListingVisibilityGrant"("granteeId", "listingId");

-- CreateIndex
CREATE INDEX "ListingVisibilityGrant_listingId_idx" ON "ListingVisibilityGrant"("listingId");

-- CreateIndex
CREATE INDEX "ListingVisibilityGrant_sourceId_idx" ON "ListingVisibilityGrant"("sourceId");

-- AddForeignKey
ALTER TABLE "ListingVisibilityGrant" ADD CONSTRAINT "ListingVisibilityGrant_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVisibilityGrant" ADD CONSTRAINT "ListingVisibilityGrant_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVisibilityGrant" ADD CONSTRAINT "ListingVisibilityGrant_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVisibilityGrant" ADD CONSTRAINT "ListingVisibilityGrant_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill forwards that already exist as listing DMs to a third person.
INSERT INTO "ListingVisibilityGrant" ("id", "kind", "listingId", "sellerId", "granteeId", "sourceId", "createdAt", "updatedAt")
SELECT
    ('c' || substr(md5(dm."id"), 1, 24)),
    'forward',
    dm."listingId",
    m."sellerId",
    dm."toUserId",
    dm."fromUserId",
    dm."createdAt",
    dm."createdAt"
FROM "DirectMessage" dm
INNER JOIN "MarketListing" m ON m."id" = dm."listingId"
WHERE dm."listingId" IS NOT NULL
  AND dm."hiddenAt" IS NULL
  AND dm."fromUserId" <> m."sellerId"
  AND dm."toUserId" <> m."sellerId"
  AND dm."fromUserId" <> dm."toUserId"
  AND m."hideIdentity" = false
  AND m."privacy" IN ('ABC', 'referral')
ON CONFLICT ("listingId", "granteeId", "sourceId") DO NOTHING;
