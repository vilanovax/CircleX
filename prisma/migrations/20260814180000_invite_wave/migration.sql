-- CreateEnum
CREATE TYPE "InviteKind" AS ENUM ('personal', 'wave');

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "invitedName" TEXT,
ADD COLUMN     "kind" "InviteKind" NOT NULL DEFAULT 'personal',
ADD COLUMN     "maxUses" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "useCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "InviteAcceptance" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteAcceptance_inviteId_userId_key" ON "InviteAcceptance"("inviteId", "userId");

-- CreateIndex
CREATE INDEX "InviteAcceptance_inviteId_idx" ON "InviteAcceptance"("inviteId");

-- CreateIndex
CREATE INDEX "InviteAcceptance_userId_idx" ON "InviteAcceptance"("userId");

-- AddForeignKey
ALTER TABLE "InviteAcceptance" ADD CONSTRAINT "InviteAcceptance_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteAcceptance" ADD CONSTRAINT "InviteAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
