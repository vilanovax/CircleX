-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "CircleEdge" ADD COLUMN "displayName" TEXT;

-- CreateTable
CREATE TABLE "CircleJoinRequest" (
    "id" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "guestUserId" TEXT NOT NULL,
    "inviteId" TEXT,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "CircleJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CircleJoinRequest_hostUserId_guestUserId_key" ON "CircleJoinRequest"("hostUserId", "guestUserId");

-- CreateIndex
CREATE INDEX "CircleJoinRequest_hostUserId_status_idx" ON "CircleJoinRequest"("hostUserId", "status");

-- CreateIndex
CREATE INDEX "CircleJoinRequest_guestUserId_idx" ON "CircleJoinRequest"("guestUserId");

-- CreateIndex
CREATE INDEX "CircleJoinRequest_inviteId_idx" ON "CircleJoinRequest"("inviteId");

-- AddForeignKey
ALTER TABLE "CircleJoinRequest" ADD CONSTRAINT "CircleJoinRequest_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleJoinRequest" ADD CONSTRAINT "CircleJoinRequest_guestUserId_fkey" FOREIGN KEY ("guestUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleJoinRequest" ADD CONSTRAINT "CircleJoinRequest_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
