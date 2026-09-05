-- AlterTable
ALTER TABLE "ListingVisibilityGrant" ADD COLUMN "opensCatalog" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ListingVisibilityGrant" AS g
SET "opensCatalog" = true
FROM "MarketListing" AS m
WHERE m.id = g."listingId"
  AND m.privacy = 'ABC'
  AND m."hideIdentity" = false;
