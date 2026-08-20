CREATE TABLE IF NOT EXISTS "authors" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT,
  "bio" TEXT,
  "avatar_url" TEXT,
  "website_url" TEXT,
  "twitter_url" TEXT,
  "facebook_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "authors_slug_key" ON "authors"("slug");
