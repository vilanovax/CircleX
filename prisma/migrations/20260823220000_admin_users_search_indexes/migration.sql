CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "User_name_trgm_idx"
  ON "User" USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "User_phoneNormalized_trgm_idx"
  ON "User" USING gin ("phoneNormalized" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "User_incomplete_createdAt_idx"
  ON "User" ("createdAt" DESC)
  WHERE "profileCompletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "User_active_ban_idx"
  ON "User" ("createdAt" DESC)
  WHERE "bannedAt" IS NOT NULL;
