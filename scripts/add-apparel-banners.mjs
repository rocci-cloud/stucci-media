// One-off: adds the two initial Stucci Apparel promotional banners
// (homepage placement), linking to stucciapparel.com. Safe to re-run —
// upserts by image_url so it won't duplicate.
// Run: node --env-file=.env.local scripts/add-apparel-banners.mjs
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const banners = [
  {
    name: "Stucci Apparel — Fell Hard, Got Up Harder",
    imageUrl: "/banners/stucci-apparel-fell-hard.png",
    sortOrder: 0,
  },
  {
    name: "Stucci Apparel — Sons of Freedom",
    imageUrl: "/banners/stucci-apparel-sons-of-freedom.png",
    sortOrder: 1,
  },
];

for (const b of banners) {
  const existing = await sql`select id from banners where image_url = ${b.imageUrl}`;
  if (existing.length > 0) {
    await sql`
      update banners set
        name = ${b.name},
        destination_url = 'https://stucciapparel.com',
        placement = 'HOMEPAGE',
        is_active = true,
        sort_order = ${b.sortOrder},
        updated_at = now()
      where image_url = ${b.imageUrl}
    `;
    console.log(`Updated: ${b.name}`);
  } else {
    await sql`
      insert into banners (id, name, image_url, destination_url, placement, is_active, sort_order, updated_at)
      values (${randomUUID()}, ${b.name}, ${b.imageUrl}, 'https://stucciapparel.com', 'HOMEPAGE', true, ${b.sortOrder}, now())
    `;
    console.log(`Created: ${b.name}`);
  }
}

console.log("Done.");
