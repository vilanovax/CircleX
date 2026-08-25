-- AlterTable
ALTER TABLE "MarketListing" ADD COLUMN "hideIdentity" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MarketListing" ADD COLUMN "excludeRelationTypes" "RelationType"[] DEFAULT ARRAY[]::"RelationType"[];

-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN "listingScoped" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DirectMessage" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'chat';

-- AlterTable
ALTER TABLE "ThreadPreference" ADD COLUMN "listingId" TEXT NOT NULL DEFAULT '';

DROP INDEX IF EXISTS "ThreadPreference_userId_peerId_key";
CREATE UNIQUE INDEX "ThreadPreference_userId_peerId_listingId_key" ON "ThreadPreference"("userId", "peerId", "listingId");

-- CreateTable
CREATE TABLE "ListingExcludePerson" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingExcludePerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingIdentityReveal" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingIdentityReveal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DirectMessage_listingId_listingScoped_idx" ON "DirectMessage"("listingId", "listingScoped");

CREATE INDEX "ListingExcludePerson_listingId_idx" ON "ListingExcludePerson"("listingId");
CREATE INDEX "ListingExcludePerson_personId_idx" ON "ListingExcludePerson"("personId");
CREATE UNIQUE INDEX "ListingExcludePerson_listingId_personId_key" ON "ListingExcludePerson"("listingId", "personId");

CREATE INDEX "ListingIdentityReveal_listingId_idx" ON "ListingIdentityReveal"("listingId");
CREATE INDEX "ListingIdentityReveal_viewerId_idx" ON "ListingIdentityReveal"("viewerId");
CREATE UNIQUE INDEX "ListingIdentityReveal_listingId_viewerId_key" ON "ListingIdentityReveal"("listingId", "viewerId");

-- AddForeignKey
ALTER TABLE "ListingExcludePerson" ADD CONSTRAINT "ListingExcludePerson_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingExcludePerson" ADD CONSTRAINT "ListingExcludePerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingIdentityReveal" ADD CONSTRAINT "ListingIdentityReveal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingIdentityReveal" ADD CONSTRAINT "ListingIdentityReveal_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
