-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN "hiddenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ListingWatch" ADD COLUMN "adminDisabledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MessageReport" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "reporterId" TEXT NOT NULL,
    "accusedId" TEXT NOT NULL,
    "reason" "ListingReportReason" NOT NULL,
    "note" TEXT,
    "textSnapshot" TEXT NOT NULL,
    "status" "ListingReportStatus" NOT NULL DEFAULT 'open',
    "hiddenMessage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DirectMessage_hiddenAt_idx" ON "DirectMessage"("hiddenAt");

-- CreateIndex
CREATE INDEX "MessageReport_status_createdAt_idx" ON "MessageReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MessageReport_accusedId_idx" ON "MessageReport"("accusedId");

-- CreateIndex
CREATE INDEX "MessageReport_reporterId_idx" ON "MessageReport"("reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReport_messageId_reporterId_key" ON "MessageReport"("messageId", "reporterId");

-- AddForeignKey
ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DirectMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_accusedId_fkey" FOREIGN KEY ("accusedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
