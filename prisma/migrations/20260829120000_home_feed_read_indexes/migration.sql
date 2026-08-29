-- CreateIndex
CREATE INDEX "CircleEdge_fromUserId_createdAt_idx" ON "CircleEdge"("fromUserId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketListing_sellerId_dealStatus_createdAt_idx" ON "MarketListing"("sellerId", "dealStatus", "createdAt");

-- CreateIndex
CREATE INDEX "SavedListing_userId_createdAt_idx" ON "SavedListing"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "HiddenListing_userId_createdAt_idx" ON "HiddenListing"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "HiddenPerson_userId_createdAt_idx" ON "HiddenPerson"("userId", "createdAt");
