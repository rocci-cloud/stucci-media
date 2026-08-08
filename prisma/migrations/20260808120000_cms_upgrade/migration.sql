-- CMS upgrade: nav-driving category fields, article tags, a media
-- library index, and simple path redirects.

ALTER TABLE "categories" ADD COLUMN "show_in_nav" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "categories" ADD COLUMN "nav_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "categories" ADD COLUMN "share_image" TEXT;

ALTER TABLE "articles" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "media_assets" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "uploaded_by_name" TEXT NOT NULL,
  "uploaded_by_email" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "media_assets_url_key" ON "media_assets"("url");
CREATE INDEX "media_assets_created_at_idx" ON "media_assets"("created_at" DESC);

CREATE TABLE "redirects" (
  "id" TEXT NOT NULL,
  "from_path" TEXT NOT NULL,
  "to_path" TEXT NOT NULL,
  "status_code" INTEGER NOT NULL DEFAULT 308,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "redirects_from_path_key" ON "redirects"("from_path");
