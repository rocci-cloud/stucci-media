CREATE TABLE IF NOT EXISTS "page_views" (
  "id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "page_type" TEXT NOT NULL,
  "article_id" INTEGER,
  "session_id" TEXT NOT NULL,
  "visitor_hash" TEXT NOT NULL,
  "referrer" TEXT,
  "referrer_domain" TEXT,
  "source" TEXT NOT NULL,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "device" TEXT NOT NULL,
  "browser" TEXT NOT NULL,
  "os" TEXT NOT NULL,
  "country" TEXT,
  "duration_ms" INTEGER,
  "scroll_pct" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "page_views_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "page_views_article_id_fkey" FOREIGN KEY ("article_id")
    REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "page_views_created_at_idx" ON "page_views"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "page_views_article_id_created_at_idx" ON "page_views"("article_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "page_views_path_created_at_idx" ON "page_views"("path", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "page_views_session_id_idx" ON "page_views"("session_id");
CREATE INDEX IF NOT EXISTS "page_views_visitor_hash_created_at_idx" ON "page_views"("visitor_hash", "created_at");
CREATE INDEX IF NOT EXISTS "page_views_source_created_at_idx" ON "page_views"("source", "created_at" DESC);
