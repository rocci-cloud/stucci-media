-- Data foundation + auth: users/sessions/accounts/verifications (Better Auth),
-- categories, article_categories, likes, comments, and new columns on the
-- existing `articles` table. Written by hand (not `prisma migrate dev`) so
-- the existing `articles`/`subscribers` data and their rows survive intact.

-- Enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "article_status" AS ENUM ('DRAFT', 'PUBLISHED');

-- Users (Better Auth)
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "accounts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" TIMESTAMP(3),
  "refresh_token_expires_at" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "verifications" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- Categories
CREATE TABLE "categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- Extend articles: new columns + author FK + status -> enum
ALTER TABLE "articles"
  ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "seo_title" TEXT,
  ADD COLUMN "seo_description" TEXT,
  ADD COLUMN "seo_keywords" TEXT,
  ADD COLUMN "og_image" TEXT,
  ADD COLUMN "canonical_url" TEXT,
  ADD COLUMN "author_id" TEXT;

ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_status_check";
ALTER TABLE "articles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "articles" ALTER COLUMN "status" TYPE "article_status"
  USING (UPPER("status")::"article_status");
ALTER TABLE "articles" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "articles_is_featured_idx" ON "articles"("is_featured");

-- ArticleCategory (many-to-many)
CREATE TABLE "article_categories" (
  "article_id" INTEGER NOT NULL,
  "category_id" TEXT NOT NULL,
  CONSTRAINT "article_categories_pkey" PRIMARY KEY ("article_id", "category_id")
);
CREATE INDEX "article_categories_category_id_idx" ON "article_categories"("category_id");
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_article_id_fkey"
  FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Likes
CREATE TABLE "likes" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "article_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "likes_user_id_article_id_key" ON "likes"("user_id", "article_id");
CREATE INDEX "likes_article_id_idx" ON "likes"("article_id");
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "likes" ADD CONSTRAINT "likes_article_id_fkey"
  FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comments
CREATE TABLE "comments" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "article_id" INTEGER NOT NULL,
  "user_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "is_approved" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "comments_article_id_is_approved_idx" ON "comments"("article_id", "is_approved");
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");
ALTER TABLE "comments" ADD CONSTRAINT "comments_article_id_fkey"
  FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
