-- No DO $$ ... $$ blocks: scripts/migrate-deploy.mjs splits on ';', which
-- would tear a dollar-quoted body in half. A bare CREATE TYPE is safe to
-- re-run because the runner treats duplicate_object (42710) as already-applied.
CREATE TYPE "SubmissionKind" AS ENUM ('GENERAL', 'PODCAST');

CREATE TYPE "SubmissionStatus" AS ENUM ('NEW', 'REVIEWING', 'APPROVED', 'DECLINED', 'ARCHIVED');

CREATE TABLE IF NOT EXISTS "submissions" (
  "id" TEXT NOT NULL,
  "kind" "SubmissionKind" NOT NULL DEFAULT 'GENERAL',
  "status" "SubmissionStatus" NOT NULL DEFAULT 'NEW',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "contact" TEXT,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "show_name" TEXT,
  "feed_url" TEXT,
  "imported_podcast_id" TEXT,
  "admin_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "submissions_status_created_at_idx" ON "submissions"("status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "submissions_kind_created_at_idx" ON "submissions"("kind", "created_at" DESC);
