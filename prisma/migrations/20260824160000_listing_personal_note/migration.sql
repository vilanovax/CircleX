-- CreateTable
CREATE TABLE "ListingPersonalNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingPersonalNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingPersonalNote_userId_listingId_key" ON "ListingPersonalNote"("userId", "listingId");

-- CreateIndex
CREATE INDEX "ListingPersonalNote_userId_idx" ON "ListingPersonalNote"("userId");

-- CreateIndex
CREATE INDEX "ListingPersonalNote_listingId_idx" ON "ListingPersonalNote"("listingId");

-- AddForeignKey
ALTER TABLE "ListingPersonalNote" ADD CONSTRAINT "ListingPersonalNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPersonalNote" ADD CONSTRAINT "ListingPersonalNote_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
