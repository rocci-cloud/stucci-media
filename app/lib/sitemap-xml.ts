// Shared XML plumbing for the sitemap index and its children.
//
// This site outgrew Next's `app/sitemap.ts` metadata route. That route can
// only emit a single flat <urlset>, and with ~840 syndicated podcast episode
// pages against ~90 original articles, the articles were 90% of the value
// sitting in 10% of the file. Google Search Console reports coverage per
// submitted sitemap, so splitting them into an index plus children is the
// only way to see whether the reporting is being indexed independently of
// the podcast archive — and to let Google prioritise accordingly.
//
// Next's `generateSitemaps()` was the obvious alternative and was rejected:
// it emits the children but no index file, so /sitemap.xml (the URL already
// submitted to Search Console and named in robots.txt) would have stopped
// resolving. Hand-written routes keep that URL stable, and match how
// feed.xml and llms.txt are already built here.

// www, not the apex domain — see the PRODUCTION_URL comment in
// app/lib/auth.ts.
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

export type SitemapEntry = {
  path: string; // site-relative, already URL-encoded where it needs to be
  lastModified?: string | Date | null;
  changeFrequency?: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
};

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Sitemaps want W3C datetime; anything unparseable is dropped rather than
// emitted as "Invalid Date", which would invalidate the whole file.
function lastmod(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function buildUrlset(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const modified = lastmod(entry.lastModified);
      return `  <url>
    <loc>${escapeXml(`${siteUrl}${entry.path}`)}</loc>${
        modified ? `\n    <lastmod>${modified}</lastmod>` : ""
      }${
        entry.changeFrequency ? `\n    <changefreq>${entry.changeFrequency}</changefreq>` : ""
      }${entry.priority !== undefined ? `\n    <priority>${entry.priority}</priority>` : ""}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function xmlResponse(xml: string, maxAge: number): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    },
  });
}
