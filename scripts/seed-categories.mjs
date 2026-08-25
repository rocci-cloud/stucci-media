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

// Main menu is deliberately capped at 5 categories (+ the hardcoded
// "Featured" and "More" entries either side of it = 7 total nav items) —
// see CLAUDE.md's nav-management phase. Podcasts and Social Issues live
// in the "More" dropdown. navOrder is only meaningful within its own
// placement group. Re-running this script re-asserts this exact
// placement/order for these 7 real categories; any others an admin adds
// later default to MAIN/order 0 unless explicitly placed from
// /admin/categories.
const categories = [
  {
    slug: "political-news",
    name: "Political News",
    description:
      "Independent political reporting on Washington, policy fights, and the decisions shaping the country — the angles the mainstream press leaves out.",
    navPlacement: "MAIN",
    navOrder: 0,
  },
  {
    slug: "crime-investigation",
    name: "Crime & Investigation",
    description:
      "Original investigative reporting and in-depth coverage of ongoing criminal cases — the facts other outlets won't dig for.",
    navPlacement: "MAIN",
    navOrder: 1,
  },
  {
    slug: "veterans",
    name: "Veterans",
    description:
      "Stories from and for the veteran community — service, sacrifice, and the issues facing those who served.",
    navPlacement: "MAIN",
    navOrder: 2,
  },
  {
    slug: "world-news",
    name: "World News",
    description:
      "Global news and analysis on the conflicts, alliances, and events reshaping the world — reported with context mainstream outlets skip.",
    navPlacement: "MAIN",
    navOrder: 3,
  },
  {
    slug: "opinion-analysis",
    name: "Opinion & Analysis",
    description:
      "Sharp, independent commentary and analysis on the stories driving the news cycle — clear-eyed takes without the corporate filter.",
    navPlacement: "MAIN",
    navOrder: 4,
  },
  {
    slug: "podcasts",
    name: "Podcasts",
    description:
      "The Rocci Stucci Show and the full Stucci Media podcast lineup — unfiltered conversations on the news of the day.",
    // Hidden from the nav on purpose. The top-level "Podcasts" tab points
    // at /podcasts (the show and episode hub), which is what a visitor
    // clicking "Podcasts" actually wants. This category holds *articles*
    // written about the shows; it stays reachable from the hub's "From The
    // Newsroom" link, but a second "Podcasts" entry in the More dropdown
    // going somewhere different would just be a trap.
    navPlacement: "HIDDEN",
    navOrder: 0,
  },
  {
    slug: "social-issues",
    name: "Social Issues",
    description:
      "Honest reporting on the cultural and social fights shaping America — the stories other outlets are too cautious to cover.",
    navPlacement: "MORE",
    navOrder: 1,
  },
];

let upserted = 0;
for (const c of categories) {
  await sql`
    insert into categories (id, slug, name, description, nav_placement, nav_order)
    values (${randomUUID()}, ${c.slug}, ${c.name}, ${c.description}, ${c.navPlacement}::nav_placement, ${c.navOrder})
    on conflict (slug) do update set
      name = excluded.name,
      description = excluded.description,
      nav_placement = excluded.nav_placement,
      nav_order = excluded.nav_order
  `;
  upserted += 1;
}

console.log(`Seed complete: ${upserted} categor${upserted === 1 ? "y" : "ies"} upserted.`);
console.log(
  "If any existing articles have a category_slug that doesn't match one of these slugs, re-file them from /admin."
);
