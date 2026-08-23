CREATE TABLE "SystemNotice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionHref" TEXT,
    "actionLabel" TEXT,
    "actorUserId" TEXT,
    "joinRequestId" TEXT,
    "inviteId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemNotice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SystemNotice_userId_createdAt_idx" ON "SystemNotice"("userId", "createdAt");
CREATE INDEX "SystemNotice_userId_readAt_idx" ON "SystemNotice"("userId", "readAt");
CREATE INDEX "SystemNotice_userId_kind_actorUserId_idx" ON "SystemNotice"("userId", "kind", "actorUserId");

ALTER TABLE "SystemNotice" ADD CONSTRAINT "SystemNotice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
