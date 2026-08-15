-- Newsroom CMS upgrade: staff roles, editorial pipeline, soft delete,
-- revisions, media library metadata/folders, podcast episodes, site
-- settings, staff invites.

-- Roles: EDITOR / AUTHOR alongside the existing ADMIN / USER.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'EDITOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'AUTHOR';

-- Editorial pipeline statuses. SCHEDULED stays derived (PUBLISHED with a
-- future published_at), so it is intentionally not added here.
ALTER TYPE "article_status" ADD VALUE IF NOT EXISTS 'IN_REVIEW';
ALTER TYPE "article_status" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- Articles: breaking flag, soft delete, social scratchpad.
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "is_breaking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "social_notes" TEXT;

CREATE INDEX IF NOT EXISTS "articles_deleted_at_idx" ON "articles"("deleted_at");

-- Revision history.
-- The FK is declared inline rather than added by a later ALTER: this
-- runner splits statements on ";", so a DO $$ ... $$ guard block would be
-- torn in half. The migration only ever runs once (guarded by
-- _prisma_migrations), so a plain declaration is enough.
CREATE TABLE IF NOT EXISTS "article_revisions" (
    "id" TEXT NOT NULL,
    "article_id" INTEGER NOT NULL,
    "headline" TEXT NOT NULL,
    "dek" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "is_autosave" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_revisions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "article_revisions_article_id_fkey"
        FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "article_revisions_article_id_created_at_idx"
    ON "article_revisions"("article_id", "created_at" DESC);

-- Media library: folders first (media_assets references it).
CREATE TABLE IF NOT EXISTS "media_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "media_folders_slug_key" ON "media_folders"("slug");

ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "alt" TEXT;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "width" INTEGER;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "height" INTEGER;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "size_bytes" INTEGER;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "mime_type" TEXT;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "folder_id" TEXT;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "media_assets_folder_id_idx" ON "media_assets"("folder_id");

ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folder_id_fkey"
    FOREIGN KEY ("folder_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Podcast episodes.
CREATE TABLE IF NOT EXISTS "podcast_episodes" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "episode_number" INTEGER,
    "season_number" INTEGER,
    "audio_url" TEXT,
    "duration_seconds" INTEGER,
    "cover_image_url" TEXT,
    "show_notes" TEXT NOT NULL DEFAULT '',
    "transcript" TEXT NOT NULL DEFAULT '',
    "guest_name" TEXT,
    "guest_bio" TEXT,
    "status" "article_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "podcast_episodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "podcast_episodes_slug_key" ON "podcast_episodes"("slug");
CREATE INDEX IF NOT EXISTS "podcast_episodes_status_published_at_idx"
    ON "podcast_episodes"("status", "published_at" DESC);

-- Site settings (flat key/value).
CREATE TABLE IF NOT EXISTS "site_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- Staff invites.
CREATE TABLE IF NOT EXISTS "invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "token" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "invites_email_key" ON "invites"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "invites_token_key" ON "invites"("token");
