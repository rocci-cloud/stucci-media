// One-time data-cleanup: corrects article categorization left over from the
// WordPress import (scripts/import-wordpress.mjs), which used a best-effort
// mapping that fell back to opinion-analysis (the catch-all) whenever it
// couldn't confidently map a WordPress category. Content review found 25 of
// the 89 imported articles filed under the wrong one of the site's 7
// categories.
//
// scripts/data/category-corrections.json is the full 89-article review
// (kept for the record); this script only acts on entries with changed: true.
//
// For each corrected article: updates the legacy `category_slug` column
// (what the public site's nav/category pages read) and replaces its
// article_categories join-table row (single-category correction, not an
// addition) — the same two things ArticleForm's save path keeps in sync.
//
// Usage: node --env-file=.env.local scripts/recategorize-articles.mjs
// Safe to re-run: an article already at its recommended category is a no-op.

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const corrections = JSON.parse(
  readFileSync(new URL("./data/category-corrections.json", import.meta.url), "utf8")
).filter((c) => c.changed);

console.log(`Applying ${corrections.length} category corrections...\n`);

const categories = await sql`select id, slug from categories`;
const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

let ok = 0;
let skipped = 0;
let failed = 0;

for (const c of corrections) {
  const categoryId = categoryIdBySlug.get(c.recommendedCategory);
  if (!categoryId) {
    console.error(`  ✗ id ${c.id} (${c.slug}): unknown category slug "${c.recommendedCategory}"`);
    failed++;
    continue;
  }

  try {
    const current = await sql`select category_slug from articles where id = ${c.id}`;
    if (current.length === 0) {
      console.error(`  ✗ id ${c.id} (${c.slug}): article not found`);
      failed++;
      continue;
    }
    if (current[0].category_slug === c.recommendedCategory) {
      console.log(`  – id ${c.id} (${c.slug}): already ${c.recommendedCategory}, skipping`);
      skipped++;
      continue;
    }

    await sql`update articles set category_slug = ${c.recommendedCategory} where id = ${c.id}`;
    await sql`delete from article_categories where article_id = ${c.id}`;
    await sql`insert into article_categories (article_id, category_id) values (${c.id}, ${categoryId})`;

    console.log(`  ✓ id ${c.id} (${c.slug}): ${c.currentCategory} -> ${c.recommendedCategory}`);
    ok++;
  } catch (err) {
    console.error(`  ✗ id ${c.id} (${c.slug}): ${err.message}`);
    failed++;
  }
}

console.log(`\nDone. ${ok} corrected, ${skipped} already correct, ${failed} failed.`);
