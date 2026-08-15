-- CreateTable
CREATE TABLE "InviteExpected" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "joinedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteExpected_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteExpected_inviteId_phone_key" ON "InviteExpected"("inviteId", "phone");

-- CreateIndex
CREATE INDEX "InviteExpected_inviteId_idx" ON "InviteExpected"("inviteId");

-- CreateIndex
CREATE INDEX "InviteExpected_phone_idx" ON "InviteExpected"("phone");

-- AddForeignKey
ALTER TABLE "InviteExpected" ADD CONSTRAINT "InviteExpected_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteExpected" ADD CONSTRAINT "InviteExpected_joinedUserId_fkey" FOREIGN KEY ("joinedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
