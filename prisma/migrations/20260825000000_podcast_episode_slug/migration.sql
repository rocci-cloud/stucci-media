-- Episode pages need a real, shareable URL segment. The feed's <guid> is
-- unique but routinely a full URL or a UUID, so it can't go in a path;
-- this derives a slug from the title instead, unique within its show.
ALTER TABLE "podcast_feed_episodes" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Backfill: slugify the title, then de-duplicate within each show by
-- appending -2, -3 … to every collision after the first. Episodes whose
-- title slugifies to nothing (emoji-only, CJK) fall back to the episode
-- number, then to a truncated id, so every row ends up addressable.
WITH slugged AS (
  SELECT
    "id",
    "podcast_id",
    COALESCE(
      NULLIF(trim(both '-' from regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g')), ''),
      NULLIF('episode-' || "episode_number"::text, 'episode-'),
      'episode-' || substr("id", 1, 8)
    ) AS base
  FROM "podcast_feed_episodes"
  WHERE "slug" IS NULL
),
numbered AS (
  SELECT "id", "podcast_id", left(base, 80) AS base,
         row_number() OVER (PARTITION BY "podcast_id", left(base, 80) ORDER BY "id") AS n
  FROM slugged
)
UPDATE "podcast_feed_episodes" e
SET "slug" = CASE WHEN numbered.n = 1 THEN numbered.base
                  ELSE numbered.base || '-' || numbered.n::text END
FROM numbered
WHERE e."id" = numbered."id";

ALTER TABLE "podcast_feed_episodes" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "podcast_feed_episodes_podcast_id_slug_key"
  ON "podcast_feed_episodes" ("podcast_id", "slug");
