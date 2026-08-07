// One-time data-cleanup: all 89 articles had null seo_title/seo_description/
// seo_keywords (never populated by the WordPress import or seed scripts —
// only the Phase 9 admin editor writes these, and no article had been
// re-saved through it since). scripts/data/seo-backfill.json holds
// per-article values generated to score well against app/lib/seo-score.ts's
// actual rules (title <=60 chars, description ~120-160 chars, a focus
// keyword that appears in at least 3 of {title, description, slug, body}).
//
// Usage: node --env-file=.env.local scripts/backfill-seo.mjs
// Safe to re-run: only writes rows where seo_title is currently null.

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const entries = JSON.parse(readFileSync(new URL("./data/seo-backfill.json", import.meta.url), "utf8"));

console.log(`Backfilling SEO fields for ${entries.length} articles...\n`);

let ok = 0;
let skipped = 0;
let failed = 0;

for (const e of entries) {
  try {
    const existing = await sql`select seo_title from articles where id = ${e.id}`;
    if (existing.length === 0) {
      console.error(`  ✗ id ${e.id} (${e.slug}): article not found`);
      failed++;
      continue;
    }
    if (existing[0].seo_title) {
      console.log(`  – id ${e.id} (${e.slug}): already has seo_title, skipping`);
      skipped++;
      continue;
    }
    await sql`
      update articles
      set seo_title = ${e.seoTitle}, seo_description = ${e.seoDescription}, seo_keywords = ${e.seoKeywords}
      where id = ${e.id}
    `;
    console.log(`  ✓ id ${e.id} (${e.slug})`);
    ok++;
  } catch (err) {
    console.error(`  ✗ id ${e.id} (${e.slug}): ${err.message}`);
    failed++;
  }
}

console.log(`\nDone. ${ok} backfilled, ${skipped} already set, ${failed} failed.`);
