// One-off publisher for the Nepal floods feature, "A Mountain Fell on
// Wednesday Morning. Nepal Is Still Counting."
//
// Written as a script (rather than pasted into /admin) because the article
// ships with three data graphics that have to land in this app's own Vercel
// Blob store and be indexed in the Media Library before anything in the
// database points at them.
//
// The graphics are built locally by scripts/build-nepal-graphics.mjs and
// read off disk here. They are diagrams, not photographs: an AI-generated
// photoreal image of a real disaster with ~676 confirmed dead would be
// indistinguishable from documentary photography of that disaster, which
// is not something this newsroom publishes. Every number drawn in them is
// attributed on the graphic itself.
//
// Run locally:
//   node scripts/build-nepal-graphics.mjs
//   node --env-file=.env.local scripts/publish-nepal-floods.mjs
// Or from the Actions tab: "Publish: Nepal floods feature".
//
// Safe to re-run. Upserts the article by slug, upserts the join-table
// category row, and overwrites the same three Blob paths rather than
// piling up duplicates.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import sanitizeHtml from "sanitize-html";

const here = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(here, "data");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const meta = JSON.parse(readFileSync(join(DATA_DIR, "nepal-floods-article.json"), "utf8"));
let body = readFileSync(join(DATA_DIR, "nepal-floods-body.html"), "utf8");

// The body HTML is hand-authored strictly inside app/lib/sanitize.ts's
// allowlist and was verified to round-trip through it with an identical tag
// sequence and identical visible text. It is inserted as authored (the same
// way scripts/import-wordpress.mjs inserts its own pre-cleaned HTML) so the
// two internal /category/... links keep a clean rel: the app's sanitizer
// applies a blanket nofollow + target=_blank transform to every anchor,
// which is right for outbound citations and wrong for our own pages.
// This pass is a structural safety net, not a rewrite.
function assertBodyIsSafe(html) {
  const stripped = sanitizeHtml(html, {
    allowedTags: [
      "p", "h2", "h3", "h4", "b", "strong", "i", "em", "u", "s", "br", "hr",
      "ul", "ol", "li", "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "a", "img", "figure", "figcaption", "div", "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "class"],
      figure: ["class"],
      div: ["class"],
      span: ["class"],
    },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
  });
  const tags = (s) => (s.match(/<[a-z][^>]*>/gi) || []).map((t) => t.split(/[\s>]/)[0]);
  const before = JSON.stringify(tags(html));
  const after = JSON.stringify(tags(stripped));
  if (before !== after) {
    console.error("Body HTML contains markup outside the site's allowlist. Refusing to publish.");
    process.exit(1);
  }
}

// --- Images -------------------------------------------------------------
// Each generated image is fetched once and re-hosted into this app's own
// Blob store. A fetch failure is reported loudly rather than swallowed:
// Phase 11's lesson was that a script exiting 0 does not mean the work
// happened, so the counts below are the thing to read, not the exit code.
async function upload(key) {
  const spec = meta.images[key];
  const path = join(DATA_DIR, spec.file);
  if (!existsSync(path)) {
    console.warn(`  ! ${spec.filename}: not found at ${path} — run scripts/build-nepal-graphics.mjs first`);
    return null;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(`  ! ${spec.filename}: BLOB_READ_WRITE_TOKEN not set, skipping upload`);
    return null;
  }
  const bytes = readFileSync(path);
  const blob = await put(`articles/${meta.slug}/${spec.filename}`, bytes, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  console.log(`  + ${spec.filename}: ${(bytes.length / 1024).toFixed(0)} KB -> ${blob.url}`);

  // Index it in the Media Library so these are manageable from /admin/media
  // like any admin-uploaded file, not orphaned Blob objects.
  await sql`
    insert into media_assets (id, url, filename, uploaded_by_name, uploaded_by_email, alt, mime_type, tags)
    values (${"mda_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36)},
            ${blob.url}, ${spec.filename}, ${"Publish script"}, ${"editorial@stuccimedia.com"},
            ${spec.alt}, ${"image/png"}, ${["nepal-floods"]})
    on conflict (url) do update set alt = excluded.alt
  `;
  return blob.url;
}

console.log("Uploading graphics into Vercel Blob:");
const coverUrl = await upload("cover");
const inline1Url = await upload("inline1");
const inline2Url = await upload("inline2");

const figure = (url, alt, caption) =>
  url
    ? `<figure class="article-figure"><img src="${url}" alt="${alt}" class="align-full" /><figcaption>${caption}</figcaption></figure>`
    : "";

body = body
  .replace(
    "{{IMAGE_1}}",
    figure(inline1Url, meta.images.inline1.alt,
      "Stucci Media graphic. Figures as of 29 August 2026 and still provisional — sources: Reuters, IFRC, UNICEF, WHO, Nepal Ministry of Finance."),
  )
  .replace(
    "{{IMAGE_2}}",
    figure(inline2Url, meta.images.inline2.alt,
      "Stucci Media graphic. The toll rose through the week as rescuers reached communities that had been cut off, not because the flooding continued."),
  );

assertBodyIsSafe(body);

// og-default.png is the sitewide branded share card and a valid fallback,
// so a Blob outage degrades the article's cover rather than nulling it.
const finalCover = coverUrl || "/og-default.png";

// --- Article ------------------------------------------------------------
const existing = await sql`select id from articles where slug = ${meta.slug}`;
let articleId;

if (existing.length > 0) {
  articleId = existing[0].id;
  await sql`
    update articles set
      category_slug = ${meta.categorySlug},
      headline = ${meta.headline},
      dek = ${meta.dek},
      author = ${meta.author},
      body = ${body},
      tags = ${meta.tags},
      cover_image_url = ${finalCover},
      og_image = ${finalCover},
      bullet_points = ${meta.bulletPoints},
      comparison_title = ${meta.comparisonTitle},
      comparison_body = ${meta.comparisonBody},
      comparison_source_label = ${meta.comparisonSourceLabel},
      comparison_source_url = ${meta.comparisonSourceUrl},
      social_notes = ${meta.socialNotes},
      seo_title = ${meta.seoTitle},
      seo_description = ${meta.seoDescription},
      seo_keywords = ${meta.seoKeywords},
      is_featured = ${meta.isFeatured},
      is_exclusive = ${meta.isExclusive},
      status = 'PUBLISHED',
      -- Every public read goes through publishedWhere() in lib/articles.ts,
      -- which requires published_at <= now on top of the status. Setting
      -- status alone would mark a row PUBLISHED and leave it invisible to
      -- readers if its published_at were still null. coalesce rather than
      -- now() so a re-run never resets the original publication date, which
      -- would corrupt datePublished in the article's structured data and
      -- bump it back to the top of every recency-ordered rail.
      published_at = coalesce(published_at, now()),
      deleted_at = null,
      updated_at = now()
    where id = ${articleId}
  `;
  console.log(`\nUpdated existing article (id ${articleId}).`);
} else {
  const rows = await sql`
    insert into articles (
      slug, category_slug, headline, dek, author, body, tags,
      cover_image_url, og_image, bullet_points,
      comparison_title, comparison_body, comparison_source_label, comparison_source_url,
      social_notes, seo_title, seo_description, seo_keywords,
      is_featured, is_exclusive, status, published_at, updated_at
    ) values (
      ${meta.slug}, ${meta.categorySlug}, ${meta.headline}, ${meta.dek}, ${meta.author}, ${body}, ${meta.tags},
      ${finalCover}, ${finalCover}, ${meta.bulletPoints},
      ${meta.comparisonTitle}, ${meta.comparisonBody}, ${meta.comparisonSourceLabel}, ${meta.comparisonSourceUrl},
      ${meta.socialNotes}, ${meta.seoTitle}, ${meta.seoDescription}, ${meta.seoKeywords},
      ${meta.isFeatured}, ${meta.isExclusive}, 'PUBLISHED', now(), now()
    )
    returning id
  `;
  articleId = rows[0].id;
  console.log(`\nCreated article (id ${articleId}).`);
}

// Phase 13's lesson: a direct SQL insert bypasses syncArticleCategories(),
// so the join row has to be written explicitly or the multi-category data
// is silently thin for this article.
const cat = await sql`select id from categories where slug = ${meta.categorySlug}`;
if (cat.length === 0) {
  console.warn(`! No category row for "${meta.categorySlug}". Run \`npm run db:seed-categories\` and re-run this script.`);
} else {
  await sql`
    insert into article_categories (article_id, category_id)
    values (${articleId}, ${cat[0].id})
    on conflict (article_id, category_id) do nothing
  `;
  console.log(`Linked to category "${meta.categorySlug}".`);
}

const imagesOk = [coverUrl, inline1Url, inline2Url].filter(Boolean).length;
console.log(`\nImages re-hosted: ${imagesOk}/3${imagesOk < 3 ? "  <-- READ THE WARNINGS ABOVE, the article published with a fallback image" : ""}`);
console.log(`Live at: https://www.stuccimedia.com/articles/${meta.slug}`);
