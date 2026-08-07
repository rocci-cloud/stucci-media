-- Better Auth's admin plugin expects `banned`/`banReason`/`banExpires` on
-- User and `impersonatedBy` on Session (discovered at runtime: sign-up
-- failed with "Unknown argument `banned`" until these existed).
ALTER TABLE "users"
  ADD COLUMN "banned" BOOLEAN DEFAULT false,
  ADD COLUMN "ban_reason" TEXT,
  ADD COLUMN "ban_expires" TIMESTAMP(3);

ALTER TABLE "sessions"
  ADD COLUMN "impersonated_by" TEXT;
