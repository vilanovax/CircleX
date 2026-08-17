-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "listingId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DirectMessage_toUserId_createdAt_idx" ON "DirectMessage"("toUserId", "createdAt");

-- CreateIndex
CREATE INDEX "DirectMessage_fromUserId_createdAt_idx" ON "DirectMessage"("fromUserId", "createdAt");

-- CreateIndex
CREATE INDEX "DirectMessage_toUserId_fromUserId_idx" ON "DirectMessage"("toUserId", "fromUserId");

-- CreateIndex
CREATE INDEX "DirectMessage_toUserId_readAt_idx" ON "DirectMessage"("toUserId", "readAt");

-- CreateIndex
CREATE INDEX "DirectMessage_listingId_idx" ON "DirectMessage"("listingId");

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
