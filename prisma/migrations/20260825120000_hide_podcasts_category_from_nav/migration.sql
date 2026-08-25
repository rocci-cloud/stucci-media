-- The top-level "Podcasts" nav tab now points at /podcasts (the show and
-- episode hub). The podcasts *category* holds articles written about the
-- shows and lives at /category/podcasts — a second "Podcasts" entry in the
-- More dropdown going somewhere different is a trap, so hide it. Its
-- articles stay reachable from the hub's "From The Newsroom" link.
--
-- Scoped to rows still sitting at the old default: if an editor has since
-- moved this category deliberately, that choice is left alone. Migrations
-- run once, so a later change from the admin is never undone by this.
UPDATE "categories"
SET "nav_placement" = 'HIDDEN'
WHERE "slug" = 'podcasts'
  AND "nav_placement" = 'MORE';
