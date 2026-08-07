// One-time fix: article images were imported from WordPress
// (scripts/import-wordpress.mjs) as hotlinks straight to the original
// site's own media library — e.g. cover_image_url and inline <img> tags
// in `body` both point at https://stuccimedia.com/wp-content/uploads/...
// As long as stuccimedia.com kept pointing at the old WordPress install
// this quietly worked. Once the domain was pointed at this app instead,
// every one of those links broke — nothing on this site's own storage
// ever served them.
//
// This re-hosts every broken image on Vercel Blob (the storage this app
// actually owns — same place /admin's upload button writes to) and
// rewrites the database to point at the new permanent URLs. The old
// content is still reachable at https://rsmnews.com/ under the same
// paths, so that's the source this pulls from.
//
// IMPORTANT: this must be run somewhere with real outbound internet
// access to rsmnews.com — a sandboxed agent session typically won't have
// that. Run it from your own machine:
//
//   node --env-file=.env.local scripts/rehost-images.mjs
//
// Requires (in .env.local, alongside the usual DATABASE_URL):
//   BLOB_READ_WRITE_TOKEN=...
//     Vercel dashboard → Storage → your Blob store → "Create Token"
//     (a Read/Write token). The app's own runtime uses OIDC and never
//     needed this, but a script running outside Vercel does.
//
// Safe to re-run: only touches rows that still reference stuccimedia.com;
// already-fixed rows (now pointing at blob.vercel-storage.com) are
// skipped automatically.

import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";

const SOURCE_ORIGIN = "https://rsmnews.com";
const BROKEN_HOST = "stuccimedia.com";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "BLOB_READ_WRITE_TOKEN is not set. Create one in the Vercel dashboard: " +
      "Storage → your Blob store → Create Token (Read/Write), then add it to .env.local."
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function rehostOne(brokenUrl, label) {
  const path = new URL(brokenUrl).pathname; // e.g. /wp-content/uploads/2025/10/alabama.png
  const sourceUrl = `${SOURCE_ORIGIN}${path}`;

  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${sourceUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const filename = path.split("/").pop() || "image";
  const blob = await put(`article-images/${label}-${filename}`, buffer, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

// --- 1. Cover images ---

const coverRows = await sql`
  select id, slug, cover_image_url from articles
  where cover_image_url like ${"%" + BROKEN_HOST + "%"}
`;
console.log(`Cover images to re-host: ${coverRows.length}`);

let coverOk = 0;
let coverFailed = 0;
for (const row of coverRows) {
  try {
    const newUrl = await rehostOne(row.cover_image_url, row.slug);
    await sql`update articles set cover_image_url = ${newUrl} where id = ${row.id}`;
    console.log(`  ✓ ${row.slug}`);
    coverOk++;
  } catch (err) {
    console.error(`  ✗ ${row.slug}: ${err.message}`);
    coverFailed++;
  }
}

// --- 2. Inline images inside article body HTML ---

const bodyRows = await sql`
  select id, slug, body from articles
  where body like ${'%<img%src="https://' + BROKEN_HOST + '%'}
`;
console.log(`\nArticles with broken inline body images: ${bodyRows.length}`);

let inlineOk = 0;
let inlineFailed = 0;
for (const row of bodyRows) {
  // Scoped to actual <img src="..."> attributes only — a naive
  // "any stuccimedia.com URL in the body" scan also catches plain <a href>
  // links to other articles on the site (real links, not broken images),
  // which would corrupt them if "rehosted" the same way.
  const imgSrcPattern = new RegExp(
    `<img[^>]+src=["'](https://${BROKEN_HOST.replace(".", "\\.")}[^"']*)["']`,
    "g"
  );
  const matches = [...new Set([...row.body.matchAll(imgSrcPattern)].map((m) => m[1]))];

  let newBody = row.body;
  for (const [i, brokenUrl] of matches.entries()) {
    try {
      const newUrl = await rehostOne(brokenUrl, `${row.slug}-inline-${i}`);
      newBody = newBody.split(brokenUrl).join(newUrl);
      console.log(`  ✓ ${row.slug} (inline image ${i + 1}/${matches.length})`);
      inlineOk++;
    } catch (err) {
      console.error(`  ✗ ${row.slug} (inline image ${i + 1}/${matches.length}): ${err.message}`);
      inlineFailed++;
    }
  }

  if (newBody !== row.body) {
    await sql`update articles set body = ${newBody} where id = ${row.id}`;
  }
}

console.log(
  `\nDone. Cover images: ${coverOk} fixed, ${coverFailed} failed. ` +
    `Inline images: ${inlineOk} fixed, ${inlineFailed} failed.`
);
if (coverFailed > 0 || inlineFailed > 0) {
  console.log("Failed ones are usually a filename/path mismatch between the two sites — check manually.");
}
