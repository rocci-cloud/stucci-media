-- Syndicated podcasts: a show mirrored from an RSS feed, plus its episodes.
--
-- Deliberately kept to three statements with every constraint declared
-- inline. Vercel's Neon query console rejects multi-command input
-- ("cannot insert multiple commands into a prepared statement"), so these
-- get pasted and run one at a time by hand; fewer statements is fewer
-- chances to skip one and end up with a half-created table.

CREATE TABLE IF NOT EXISTS "podcasts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "feed_url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "cover_image_url" TEXT,
    "author" TEXT,
    "website_url" TEXT,
    "language" TEXT,
    "is_explicit" BOOLEAN NOT NULL DEFAULT false,
    "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "last_fetched_at" TIMESTAMP(3),
    "last_fetch_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "podcasts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "podcasts_slug_key" UNIQUE ("slug"),
    CONSTRAINT "podcasts_feed_url_key" UNIQUE ("feed_url")
);

CREATE TABLE IF NOT EXISTS "podcast_feed_episodes" (
    "id" TEXT NOT NULL,
    "podcast_id" TEXT NOT NULL,
    "guid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "audio_url" TEXT,
    "audio_type" TEXT,
    "duration_seconds" INTEGER,
    "image_url" TEXT,
    "episode_url" TEXT,
    "episode_number" INTEGER,
    "season_number" INTEGER,
    "is_explicit" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "podcast_feed_episodes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "podcast_feed_episodes_podcast_id_guid_key" UNIQUE ("podcast_id", "guid"),
    CONSTRAINT "podcast_feed_episodes_podcast_id_fkey"
        FOREIGN KEY ("podcast_id") REFERENCES "podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "podcast_feed_episodes_podcast_id_published_at_idx"
    ON "podcast_feed_episodes"("podcast_id", "published_at" DESC);
