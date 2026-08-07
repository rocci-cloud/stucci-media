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
// rewrites the database to point at the new permanent URLs.
//
// Two ways to find the source image, in priority order:
//   1. A fresh WordPress export XML (optional first argument) — the same
//      content is now live at rsmnews.com, and its export's attachment
//      URLs are the verified-correct current location per article
//      (matched by post slug). Handles cases where a filename changed
//      between the old export and now.
//   2. Fallback: naive domain swap (stuccimedia.com -> rsmnews.com,
//      same path) for anything not found in the XML, or if no XML is
//      given at all.
//
// IMPORTANT: this must be run somewhere with real outbound internet
// access to rsmnews.com — a sandboxed agent session typically won't have
// that. Run it from your own machine:
//
//   node --env-file=.env.local scripts/rehost-images.mjs [path-to-export.xml]
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

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { XMLParser } from "fast-xml-parser";

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

// --- Optional: parse a fresh WordPress export for verified-correct URLs ---

const xmlPath = process.argv[2];
let postsBySlug = new Map();

if (xmlPath) {
  const xml = readFileSync(xmlPath, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["item", "category", "wp:postmeta"].includes(name),
  });
  const items = parser.parse(xml).rss.channel.item;

  const attachmentsById = new Map();
  for (const item of items) {
    if (item["wp:post_type"] === "attachment") {
      attachmentsById.set(String(item["wp:post_id"]), item["wp:attachment_url"]);
    }
  }

  for (const item of items) {
    if (item["wp:post_type"] !== "post") continue;
    const slug = item["wp:post_name"];
    if (!slug) continue;

    const content = item["content:encoded"] || "";
    const thumbMeta = item["wp:postmeta"]?.find((m) => m["wp:meta_key"] === "_thumbnail_id");
    const coverImageUrl = thumbMeta ? attachmentsById.get(String(thumbMeta["wp:meta_value"])) ?? null : null;
    const inlineUrls = [...content.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]);

    // filename -> verified current URL, for matching against whatever
    // filename our own broken URL happens to reference
    const byFilename = new Map();
    for (const url of [coverImageUrl, ...inlineUrls].filter(Boolean)) {
      byFilename.set(url.split("/").pop(), url);
    }

    postsBySlug.set(slug, { coverImageUrl, byFilename });
  }

  console.log(`Loaded ${postsBySlug.size} posts from the export for verified URL matching.\n`);
}

function resolveSourceUrl(brokenUrl, articleSlug, { preferCover } = {}) {
  const path = new URL(brokenUrl).pathname;
  const filename = path.split("/").pop();
  const post = postsBySlug.get(articleSlug);

  if (post) {
    if (preferCover && post.coverImageUrl) return post.coverImageUrl;
    const verified = post.byFilename.get(filename);
    if (verified) return verified;
  }

  // Fallback: naive domain swap, same path
  return `${SOURCE_ORIGIN}${path}`;
}

async function rehostOne(sourceUrl, label) {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${sourceUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const filename = new URL(sourceUrl).pathname.split("/").pop() || "image";
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
    const sourceUrl = resolveSourceUrl(row.cover_image_url, row.slug, { preferCover: true });
    const newUrl = await rehostOne(sourceUrl, row.slug);
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
      const sourceUrl = resolveSourceUrl(brokenUrl, row.slug);
      const newUrl = await rehostOne(sourceUrl, `${row.slug}-inline-${i}`);
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
