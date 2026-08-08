// One-off: adds the two Stucci Apparel promotional banners to both the
// homepage and article ("blog") placements, linking to stucciapparel.com.
// Safe to re-run — upserts by (image_url, placement) pair, so each image
// gets its own row per placement rather than being limited to one
// placement total.
// Run: node --env-file=.env.local scripts/add-apparel-banners.mjs
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const images = [
  { name: "Stucci Apparel — Fell Hard, Got Up Harder", imageUrl: "/banners/stucci-apparel-fell-hard.png", sortOrder: 0 },
  { name: "Stucci Apparel — Sons of Freedom", imageUrl: "/banners/stucci-apparel-sons-of-freedom.png", sortOrder: 1 },
];
const placements = ["HOMEPAGE", "ARTICLE"];

for (const placement of placements) {
  for (const b of images) {
    const existing = await sql`
      select id from banners where image_url = ${b.imageUrl} and placement = ${placement}::banner_placement
    `;
    if (existing.length > 0) {
      await sql`
        update banners set
          name = ${b.name},
          destination_url = 'https://stucciapparel.com',
          is_active = true,
          sort_order = ${b.sortOrder},
          updated_at = now()
        where id = ${existing[0].id}
      `;
      console.log(`Updated: ${b.name} (${placement})`);
    } else {
      await sql`
        insert into banners (id, name, image_url, destination_url, placement, is_active, sort_order, updated_at)
        values (${randomUUID()}, ${b.name}, ${b.imageUrl}, 'https://stucciapparel.com', ${placement}::banner_placement, true, ${b.sortOrder}, now())
      `;
      console.log(`Created: ${b.name} (${placement})`);
    }
  }
}

console.log("Done.");
