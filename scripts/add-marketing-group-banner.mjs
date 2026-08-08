// One-off: adds the Stucci Marketing Group cross-promotion banner to
// both the homepage and article ("blog") placements, linking to
// stuccimarketing.com. Safe to re-run — upserts by (image_url,
// placement) pair, same convention as add-apparel-banners.mjs.
// Run: node --env-file=.env.local scripts/add-marketing-group-banner.mjs
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const name = "Stucci Marketing Group";
const imageUrl = "/banners/stucci-marketing-group.png";
const destinationUrl = "https://stuccimarketing.com";
// Sorts after the two existing Stucci Apparel banners (order 0/1) in
// each placement, rather than competing with them for the lead slot.
const sortOrder = 2;
const placements = ["HOMEPAGE", "ARTICLE"];

for (const placement of placements) {
  const existing = await sql`
    select id from banners where image_url = ${imageUrl} and placement = ${placement}::banner_placement
  `;
  if (existing.length > 0) {
    await sql`
      update banners set
        name = ${name},
        destination_url = ${destinationUrl},
        is_active = true,
        sort_order = ${sortOrder},
        updated_at = now()
      where id = ${existing[0].id}
    `;
    console.log(`Updated: ${name} (${placement})`);
  } else {
    await sql`
      insert into banners (id, name, image_url, destination_url, placement, is_active, sort_order, updated_at)
      values (${randomUUID()}, ${name}, ${imageUrl}, ${destinationUrl}, ${placement}::banner_placement, true, ${sortOrder}, now())
    `;
    console.log(`Created: ${name} (${placement})`);
  }
}

console.log("Done.");
