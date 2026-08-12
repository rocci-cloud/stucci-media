-- Reader engagement quick wins: BLUF bullets + comparison callout +
-- exclusive flag on articles, Editor's Pick pinning on comments, and a
-- new saved_articles ("read later") table.

ALTER TABLE "articles" ADD COLUMN "bullet_points" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "articles" ADD COLUMN "comparison_title" TEXT;
ALTER TABLE "articles" ADD COLUMN "comparison_body" TEXT;
ALTER TABLE "articles" ADD COLUMN "comparison_source_label" TEXT;
ALTER TABLE "articles" ADD COLUMN "comparison_source_url" TEXT;
ALTER TABLE "articles" ADD COLUMN "is_exclusive" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "comments" ADD COLUMN "is_pinned" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "saved_articles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "article_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "saved_articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_articles_user_id_article_id_key" ON "saved_articles"("user_id", "article_id");
CREATE INDEX "saved_articles_article_id_idx" ON "saved_articles"("article_id");
CREATE INDEX "saved_articles_user_id_created_at_idx" ON "saved_articles"("user_id", "created_at" DESC);

ALTER TABLE "saved_articles" ADD CONSTRAINT "saved_articles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_articles" ADD CONSTRAINT "saved_articles_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
