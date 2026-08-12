-- Tier 3 engagement: live blog format + browser push alert subscriptions.

ALTER TABLE "articles" ADD COLUMN "is_live_blog" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "live_blog_entries" (
  "id" TEXT NOT NULL,
  "article_id" INTEGER NOT NULL,
  "headline" TEXT,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "live_blog_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "live_blog_entries_article_id_created_at_idx" ON "live_blog_entries"("article_id", "created_at" DESC);

ALTER TABLE "live_blog_entries" ADD CONSTRAINT "live_blog_entries_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "push_subscriptions" (
  "id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
