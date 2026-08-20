CREATE TABLE IF NOT EXISTS "article_views" (
  "id" TEXT NOT NULL,
  "article_id" INTEGER NOT NULL,
  "day" DATE NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "article_views_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "article_views_article_id_fkey" FOREIGN KEY ("article_id")
    REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "article_views_article_id_day_key" ON "article_views"("article_id", "day");
CREATE INDEX IF NOT EXISTS "article_views_day_idx" ON "article_views"("day");
