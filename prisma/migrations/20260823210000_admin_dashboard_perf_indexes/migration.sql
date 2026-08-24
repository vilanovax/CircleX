-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_profileCompletedAt_idx" ON "User"("profileCompletedAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "OtpChallenge_attempts_idx" ON "OtpChallenge"("attempts");

-- CreateIndex
CREATE INDEX "Invite_createdAt_idx" ON "Invite"("createdAt");

-- CreateIndex
CREATE INDEX "Invite_acceptedAt_idx" ON "Invite"("acceptedAt");

-- CreateIndex
CREATE INDEX "Invite_status_expiresAt_idx" ON "Invite"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "CircleJoinRequest_status_resolvedAt_idx" ON "CircleJoinRequest"("status", "resolvedAt");

-- CreateIndex
CREATE INDEX "MarketListing_createdAt_idx" ON "MarketListing"("createdAt");

-- CreateIndex
CREATE INDEX "MarketListing_dealStatus_idx" ON "MarketListing"("dealStatus");

-- CreateIndex
CREATE INDEX "WantRequest_createdAt_idx" ON "WantRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Gathering_createdAt_idx" ON "Gathering"("createdAt");
