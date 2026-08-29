import { getPublishedArticles } from "../../lib/articles";
import { buildUrlset, xmlResponse, type SitemapEntry } from "../../lib/sitemap-xml";

// The homepage, the handful of real standalone pages, and every published
// article. This is the file that matters — everything the site wants found
// on its own merits is in here, and nothing syndicated is.
export const revalidate = 600;

export async function GET() {
  const articles = await getPublishedArticles();

  const staticPages: SitemapEntry[] = [
    { path: "", changeFrequency: "hourly", priority: 1 },
    // A commercial landing page, so it gets a high priority: it is one of
    // the few pages on the site meant to be found by search rather than by
    // a reader already here.
    { path: "/feature-article", changeFrequency: "monthly", priority: 0.8 },
    { path: "/podcasts", changeFrequency: "daily", priority: 0.7 },
    { path: "/subscribe", changeFrequency: "monthly", priority: 0.6 },
    { path: "/about", changeFrequency: "monthly", priority: 0.4 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  ];

  // Raised from 0.7 to 0.9: articles previously sat below category pages,
  // which inverted what this site actually wants crawled first.
  const articlePages: SitemapEntry[] = articles.map((article) => ({
    path: `/articles/${article.slug}`,
    lastModified: article.publishedAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return xmlResponse(buildUrlset([...staticPages, ...articlePages]), 600);
}
