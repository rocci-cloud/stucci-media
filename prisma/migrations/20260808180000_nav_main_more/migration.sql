-- Replaces the boolean show_in_nav with a 3-state nav_placement
-- (MAIN / MORE / HIDDEN), so a category can go in the top-bar nav, the
-- "More" dropdown, or neither.
CREATE TYPE "nav_placement" AS ENUM ('MAIN', 'MORE', 'HIDDEN');

ALTER TABLE "categories" ADD COLUMN "nav_placement" "nav_placement" NOT NULL DEFAULT 'MAIN';

UPDATE "categories" SET "nav_placement" = CASE WHEN "show_in_nav" THEN 'MAIN' ELSE 'HIDDEN' END::"nav_placement";

ALTER TABLE "categories" DROP COLUMN "show_in_nav";
