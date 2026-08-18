-- CreateTable
CREATE TABLE "ListingEndorsement" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingEndorsement_listingId_personId_key" ON "ListingEndorsement"("listingId", "personId");

-- CreateIndex
CREATE INDEX "ListingEndorsement_listingId_idx" ON "ListingEndorsement"("listingId");

-- CreateIndex
CREATE INDEX "ListingEndorsement_personId_idx" ON "ListingEndorsement"("personId");

-- AddForeignKey
ALTER TABLE "ListingEndorsement" ADD CONSTRAINT "ListingEndorsement_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingEndorsement" ADD CONSTRAINT "ListingEndorsement_personId_fkey" FOREIGN KEY ("personId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
