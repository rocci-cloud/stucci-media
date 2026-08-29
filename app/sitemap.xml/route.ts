import { escapeXml, siteUrl, xmlResponse } from "../lib/sitemap-xml";

// The sitemap index. This is the URL in robots.txt and the one submitted to
// Search Console, so it must keep resolving here no matter how the children
// are reorganised underneath it.
//
// Order is deliberate: articles first. It is the original reporting, it is
// what the site is trying to rank for, and a crawler working an index top to
// bottom should reach it before the podcast archive.
export const revalidate = 600;

const CHILDREN = [
  "/sitemaps/articles.xml",
  "/sitemaps/sections.xml",
  "/sitemaps/podcasts.xml",
  "/sitemaps/episodes.xml",
] as const;

export async function GET() {
  // One timestamp for the whole index: the children are regenerated on their
  // own revalidate windows, and a per-child lastmod here would be a guess
  // about content this route never reads.
  const now = new Date().toISOString();

  const entries = CHILDREN.map(
    (path) => `  <sitemap>
    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
  ).join("\n");

  return xmlResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`,
    600,
  );
}
