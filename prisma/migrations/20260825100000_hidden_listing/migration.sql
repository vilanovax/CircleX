-- CreateTable
CREATE TABLE "HiddenListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HiddenListing_userId_idx" ON "HiddenListing"("userId");

-- CreateIndex
CREATE INDEX "HiddenListing_listingId_idx" ON "HiddenListing"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "HiddenListing_userId_listingId_key" ON "HiddenListing"("userId", "listingId");

-- AddForeignKey
ALTER TABLE "HiddenListing" ADD CONSTRAINT "HiddenListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiddenListing" ADD CONSTRAINT "HiddenListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
