-- Promotional banner management. Placement is a closed enum (not free
-- text) matching the site's 3 fixed frontend slots — homepage mid-content,
-- mid-article, and near the top of category pages.
CREATE TYPE "banner_placement" AS ENUM ('HOMEPAGE', 'ARTICLE', 'CATEGORY');

CREATE TABLE "banners" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "image_url" TEXT NOT NULL,
  "destination_url" TEXT NOT NULL,
  "placement" "banner_placement" NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "banners_placement_is_active_sort_order_idx" ON "banners"("placement", "is_active", "sort_order");
