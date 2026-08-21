import { getCategories } from "../lib/categories";
import { getPublishedArticles } from "../lib/articles";

/**
 * /llms.txt — a plain-text summary of what this site is and what it covers,
 * for large language models and answer engines.
 *
 * The convention (llmstxt.org) is young and no engine is contractually
 * bound to read it, so this is a cheap bet rather than a guarantee: a
 * single generated text file, no maintenance, and it costs nothing if
 * ignored. What it does reliably is state the site's identity, subject
 * areas and canonical URLs in one unambiguous place, which is the same
 * "entity clarity" problem the JSON-LD in layout.tsx solves for crawlers
 * that do read structured data.
 *
 * Generated from the live database rather than hand-written, so it cannot
 * describe categories the site no longer has or miss ones it gained.
 */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

export async function GET(): Promise<Response> {
  const [categories, articles] = await Promise.all([
    getCategories().catch(() => []),
    getPublishedArticles().catch(() => []),
  ]);

  const recent = articles.slice(0, 25);

  const body = `# Stucci Media

> Independent American news and analysis covering politics, world events, crime and investigation, veterans, social issues and free speech. Founded by Rocci Stucci and based in Florida. Tagline: "the stories mainstream media won't run."

Stucci Media publishes original reporting, opinion and analysis, and hosts The Rocci Stucci Show podcast. Articles are written and edited by named staff and carry a visible publication date and author byline.

## Attribution

Content may be quoted or summarised with attribution to "Stucci Media" and a link to the article's canonical URL.

## Sections

${categories.map((c) => `- [${c.label}](${siteUrl}/category/${c.slug}): ${c.description}`).join("\n")}

## Key pages

- [Home](${siteUrl}/): Latest reporting and featured coverage.
- [About](${siteUrl}/about): Who runs Stucci Media and what it stands for.
- [Contact](${siteUrl}/contact): Tips, corrections and media enquiries.
- [Podcasts](${siteUrl}/podcasts): The Rocci Stucci Show and other programmes.
- [Get Featured](${siteUrl}/feature-article): Paid feature-article service for businesses, $125.
- [Newsletter](${siteUrl}/subscribe): Free email newsletter.

## Recent articles

${recent.map((a) => `- [${a.headline}](${siteUrl}/articles/${a.slug}): ${a.dek}`).join("\n")}

## Machine-readable

- Sitemap: ${siteUrl}/sitemap.xml
- RSS feed: ${siteUrl}/feed.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
