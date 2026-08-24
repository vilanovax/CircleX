-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx"
  ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminAuditLog_targetType_createdAt_idx"
  ON "AdminAuditLog"("targetType", "createdAt");
