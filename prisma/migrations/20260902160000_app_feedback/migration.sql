-- CreateEnum
CREATE TYPE "AppFeedbackKind" AS ENUM ('issue', 'suggestion', 'contact');

-- CreateEnum
CREATE TYPE "AppFeedbackStatus" AS ENUM ('open', 'reviewed', 'closed');

-- CreateTable
CREATE TABLE "AppFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AppFeedbackKind" NOT NULL,
    "body" TEXT NOT NULL,
    "path" TEXT,
    "status" "AppFeedbackStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppFeedback_status_createdAt_idx" ON "AppFeedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AppFeedback_userId_createdAt_idx" ON "AppFeedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AppFeedback_kind_createdAt_idx" ON "AppFeedback"("kind", "createdAt");

-- AddForeignKey
ALTER TABLE "AppFeedback" ADD CONSTRAINT "AppFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
