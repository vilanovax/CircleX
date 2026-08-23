-- AlterTable
ALTER TABLE "User" ADD COLUMN "bannedAt" TIMESTAMP(3),
ADD COLUMN "bannedUntil" TIMESTAMP(3),
ADD COLUMN "banReason" TEXT;

CREATE INDEX "User_bannedAt_idx" ON "User"("bannedAt");

-- AlterTable
ALTER TABLE "WantRequest" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "WantRequest_hidden_idx" ON "WantRequest"("hidden");

-- AlterTable
ALTER TABLE "Gathering" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Gathering_hidden_idx" ON "Gathering"("hidden");
