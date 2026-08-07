-- Lightweight admin audit trail. actor_name/actor_email are snapshotted at
-- write time (not just a foreign key to users) so entries still read
-- sensibly if an admin account is later renamed or deleted — actor_id has
-- no FK constraint deliberately, for the same reason.
CREATE TABLE "activity_logs" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT,
  "actor_name" TEXT NOT NULL,
  "actor_email" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_label" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at" DESC);
