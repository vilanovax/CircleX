-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "disabledAt" TIMESTAMP(3);

CREATE INDEX "AdminUser_disabledAt_idx" ON "AdminUser"("disabledAt");
