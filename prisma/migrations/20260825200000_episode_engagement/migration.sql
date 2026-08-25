-- Comments and likes can now hang off a podcast episode as well as an
-- article. Two nullable foreign keys rather than a second set of models,
-- so threading, approval, pinning and the one admin moderation queue are
-- shared rather than built twice.

ALTER TABLE "comments" ALTER COLUMN "article_id" DROP NOT NULL;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "podcast_episode_id" TEXT;

ALTER TABLE "likes" ALTER COLUMN "article_id" DROP NOT NULL;
ALTER TABLE "likes" ADD COLUMN IF NOT EXISTS "podcast_episode_id" TEXT;

ALTER TABLE "comments" ADD CONSTRAINT "comments_podcast_episode_id_fkey"
  FOREIGN KEY ("podcast_episode_id") REFERENCES "podcast_feed_episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "likes" ADD CONSTRAINT "likes_podcast_episode_id_fkey"
  FOREIGN KEY ("podcast_episode_id") REFERENCES "podcast_feed_episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Exactly one target, never both and never neither. Prisma cannot express
-- this, so without it a bug could write an orphan row that belongs to
-- nothing and renders nowhere.
ALTER TABLE "comments" ADD CONSTRAINT "comments_one_target"
  CHECK (("article_id" IS NOT NULL AND "podcast_episode_id" IS NULL)
      OR ("article_id" IS NULL AND "podcast_episode_id" IS NOT NULL));

ALTER TABLE "likes" ADD CONSTRAINT "likes_one_target"
  CHECK (("article_id" IS NOT NULL AND "podcast_episode_id" IS NULL)
      OR ("article_id" IS NULL AND "podcast_episode_id" IS NOT NULL));

-- One like per person per episode. Postgres treats NULLs as distinct, so
-- this sits alongside the existing article unique without conflict.
CREATE UNIQUE INDEX IF NOT EXISTS "likes_user_id_podcast_episode_id_key"
  ON "likes" ("user_id", "podcast_episode_id");

CREATE INDEX IF NOT EXISTS "comments_podcast_episode_id_is_approved_idx"
  ON "comments" ("podcast_episode_id", "is_approved");

CREATE INDEX IF NOT EXISTS "likes_podcast_episode_id_idx"
  ON "likes" ("podcast_episode_id");
