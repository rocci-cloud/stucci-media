// One-time import: parses a WordPress WXR export, filters out theme demo
// filler content, maps categories, sanitizes body HTML, and loads the
// real articles into Postgres — replacing the placeholder seed articles.
//
// Run: node --env-file=.env.local scripts/import-wordpress.mjs <path-to-export.xml>
import { readFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import { neon } from "@neondatabase/serverless";
import sanitizeHtml from "sanitize-html";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/import-wordpress.mjs <path-to-wordpress-export.xml>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Placeholder articles seeded in Phase 2, before any real content existed.
const PLACEHOLDER_SLUGS = [
  "car-surveillance-mandate-2027",
  "georgia-veteran-roofing-heroes",
  "free-speech-double-standard",
  "rocci-stucci-show-returns",
  "west-bank-israeli-military",
  "charities-caught-misusing-donations",
];

// Signatures unique to the "JNews" theme's Lorem-ipsum demo posts —
// none of this is real Rocci Stucci content.
const DEMO_SIGNATURES = ["Strech lining hemline", "dropcap the popularization", "intro-text", "calfskin spagh"];

const CATEGORY_PRIORITY = [
  { match: ["veterans", "military"], slug: "veterans" },
  { match: ["crime-investigation", "true-crime", "law-enforcement"], slug: "crime-investigation" },
  { match: ["world", "jnews_demo_world", "middle-east"], slug: "world-news" },
  { match: ["podcasts", "the-rocci-stucci-show", "the-mr-hanson-podcast", "video"], slug: "podcasts" },
  { match: ["political-news", "jnews_demo_politics", "national-security", "immigration"], slug: "political-news" },
  {
    match: [
      "social-issues-community-impact", "faith", "family", "inspirational",
      "historical-events-analysis", "supernatural-mysteries-ancient-secrets", "books", "in-depth-reports",
    ],
    slug: "social-issues",
  },
];
const DEFAULT_CATEGORY_SLUG = "opinion-analysis";

const ENTITY_MAP = { amp: "&", gt: ">", lt: "<", quot: '"', nbsp: " " };
function decodeEntities(text) {
  return text.replace(/&([a-z]+);/gi, (m, name) => ENTITY_MAP[name.toLowerCase()] ?? m);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function pickCategory(nicenames) {
  for (const rule of CATEGORY_PRIORITY) {
    if (nicenames.some((n) => rule.match.includes(n))) return rule.slug;
  }
  return DEFAULT_CATEGORY_SLUG;
}

// Approximates WordPress's wpautop: wraps loose text blocks in <p>,
// leaves already-block-level content (headings, images, lists) alone.
const BLOCK_TAG_RE = /^<(h2|h3|h4|ul|ol|blockquote|img)[\s>]/i;
function autoParagraph(raw) {
  return raw
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => !/^(CALL-TO-ACTION|COPYRIGHT):/i.test(block.replace(/<[^>]+>/g, "").trim()))
    .filter((block) => !/all rights reserved/i.test(block))
    .map((block) => (BLOCK_TAG_RE.test(block) ? block : `<p>${block.replace(/\n/g, " ")}</p>`))
    .join("\n");
}

function sanitizeBody(html, skipImageSrc) {
  const withParagraphs = autoParagraph(html);
  const clean = sanitizeHtml(withParagraphs, {
    allowedTags: ["p", "h2", "h3", "h4", "b", "strong", "i", "em", "a", "img", "ul", "ol", "li", "blockquote", "br", "hr"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }),
    },
    exclusiveFilter: (frame) => frame.tag === "img" && skipImageSrc && frame.attribs.src === skipImageSrc,
  });
  return clean.trim();
}

const xml = readFileSync(filePath, "utf8");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["item", "category", "wp:postmeta"].includes(name),
});
const doc = parser.parse(xml);
const items = doc.rss.channel.item;

const attachmentsById = new Map();
for (const item of items) {
  if (item["wp:post_type"] === "attachment") {
    attachmentsById.set(String(item["wp:post_id"]), item["wp:attachment_url"]);
  }
}

const posts = items.filter((item) => item["wp:post_type"] === "post" && item["wp:status"] === "publish");

const seenSlugs = new Set();
const articles = [];
let skippedDemo = 0;

for (const post of posts) {
  const contentHtml = post["content:encoded"] || "";
  if (DEMO_SIGNATURES.some((sig) => contentHtml.includes(sig))) {
    skippedDemo += 1;
    continue;
  }

  const headline = decodeEntities(String(post.title || "").trim());
  const dek = decodeEntities(String(post["excerpt:encoded"] || "").trim());

  let slug = slugify(post["wp:post_name"] || headline);
  while (seenSlugs.has(slug)) slug = `${slug}-2`;
  seenSlugs.add(slug);

  const categoryEntries = Array.isArray(post.category) ? post.category : post.category ? [post.category] : [];
  const nicenames = categoryEntries
    .filter((c) => c["@_domain"] === "category")
    .map((c) => c["@_nicename"]);
  const categorySlug = pickCategory(nicenames);

  const thumbMeta = post["wp:postmeta"]?.find((m) => m["wp:meta_key"] === "_thumbnail_id");
  let coverImageUrl = thumbMeta ? attachmentsById.get(String(thumbMeta["wp:meta_value"])) ?? null : null;
  if (!coverImageUrl) {
    const firstImg = contentHtml.match(/<img[^>]+src="([^"]+)"/i);
    coverImageUrl = firstImg ? firstImg[1] : null;
  }

  const bodyHtml = sanitizeBody(contentHtml, coverImageUrl);

  const publishedAtRaw = post["wp:post_date_gmt"];
  const publishedAt = publishedAtRaw ? `${publishedAtRaw.replace(" ", "T")}Z` : null;

  articles.push({ slug, categorySlug, headline, dek, bodyHtml, coverImageUrl, publishedAt });
}

console.log(`Parsed ${posts.length} published posts — ${skippedDemo} theme-demo filler skipped, ${articles.length} real articles to import.`);

for (const slug of PLACEHOLDER_SLUGS) {
  await sql`delete from articles where slug = ${slug}`;
}
console.log(`Removed ${PLACEHOLDER_SLUGS.length} placeholder articles.`);

let inserted = 0;
let updated = 0;
for (const a of articles) {
  const rows = await sql`
    insert into articles (slug, category_slug, headline, dek, author, body, cover_image_url, status, published_at)
    values (${a.slug}, ${a.categorySlug}, ${a.headline}, ${a.dek}, 'Rocci Stucci', ${a.bodyHtml}, ${a.coverImageUrl}, 'PUBLISHED', ${a.publishedAt})
    on conflict (slug) do update set
      category_slug = excluded.category_slug,
      headline = excluded.headline,
      dek = excluded.dek,
      body = excluded.body,
      cover_image_url = excluded.cover_image_url,
      published_at = excluded.published_at,
      updated_at = now()
    returning (xmax = 0) as inserted
  `;
  if (rows[0].inserted) inserted += 1;
  else updated += 1;
}

console.log(`Import complete: ${inserted} inserted, ${updated} updated.`);
