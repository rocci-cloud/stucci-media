// Seeds the real 7 categories the site uses today (from the former
// hardcoded app/lib/categories.ts list) into the new `categories` table.
// Safe to re-run — upserts by slug, so hand-edited descriptions/colors made
// later from a future admin UI won't be clobbered by name/description only.
// Run: node --env-file=.env.local scripts/seed-categories.mjs
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const categories = [
  { slug: "political-news", name: "Political News", description: "Washington, policy, and the politics driving the headlines." },
  { slug: "world-news", name: "World News", description: "Global events and the conflicts shaping the world." },
  { slug: "opinion-analysis", name: "Opinion & Analysis", description: "Sharp takes on the stories shaping the news cycle." },
  { slug: "podcasts", name: "Podcasts", description: "The Rocci Stucci Show and Stucci Media's full podcast lineup." },
  { slug: "social-issues", name: "Social Issues", description: "The cultural fights nobody else will cover honestly." },
  { slug: "crime-investigation", name: "Crime & Investigation", description: "Original reporting and deep dives into ongoing cases." },
  { slug: "veterans", name: "Veterans", description: "Stories from and for the veteran community." },
];

let upserted = 0;
for (const c of categories) {
  await sql`
    insert into categories (id, slug, name, description)
    values (${randomUUID()}, ${c.slug}, ${c.name}, ${c.description})
    on conflict (slug) do update set
      name = excluded.name,
      description = excluded.description
  `;
  upserted += 1;
}

console.log(`Seed complete: ${upserted} categor${upserted === 1 ? "y" : "ies"} upserted.`);
console.log(
  "If any existing articles have a category_slug that doesn't match one of these slugs, re-file them from /admin."
);
