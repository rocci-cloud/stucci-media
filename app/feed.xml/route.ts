import { getPublishedArticles } from "../lib/articles";

// www, not the apex domain — see the PRODUCTION_URL comment in
// app/lib/auth.ts.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

// News readers, aggregators and syndication services all poll a feed rather
// than crawling the site, so this reads from the same getPublishedArticles()
// query the sitemap and the homepage already use — it can't drift out of
// sync with what's actually live, including the scheduled-publishing filter.
export const revalidate = 600;

const FEED_LIMIT = 50;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// CDATA can't contain the literal sequence "]]>", so a body that happens to
// include one has to be split across two sections rather than escaped.
function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  const articles = (await getPublishedArticles()).slice(0, FEED_LIMIT);
  const updated = articles[0]?.publishedAt ?? new Date().toISOString();

  const items = articles
    .map((article) => {
      const url = `${siteUrl}/articles/${article.slug}`;
      const published = article.publishedAt ? new Date(article.publishedAt).toUTCString() : "";
      const image = article.coverImageUrl
        ? `\n      <enclosure url="${escapeXml(article.coverImageUrl)}" type="image/jpeg" />`
        : "";
      return `    <item>
      <title>${escapeXml(article.headline)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${cdata(article.dek)}</description>
      <dc:creator>${cdata(article.author)}</dc:creator>
      <category>${escapeXml(article.category)}</category>${
        published ? `\n      <pubDate>${published}</pubDate>` : ""
      }${image}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Stucci Media</title>
    <link>${siteUrl}</link>
    <description>Independent news and investigations from Florida — politics, world events, crime, veterans, social issues, and free speech, without the spin.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
