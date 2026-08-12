-- Tier 2 engagement: reading streaks + per-category interest tracking
-- (backs the homepage's personalized "Recommended For You" rail).

ALTER TABLE "users" ADD COLUMN "current_streak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "last_active_date" TIMESTAMP(3);

CREATE TABLE "category_interests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "category_slug" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "category_interests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "category_interests_user_id_category_slug_key" ON "category_interests"("user_id", "category_slug");
CREATE INDEX "category_interests_user_id_idx" ON "category_interests"("user_id");

ALTER TABLE "category_interests" ADD CONSTRAINT "category_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
