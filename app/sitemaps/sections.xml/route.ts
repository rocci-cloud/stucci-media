import { getAllTagsWithCounts } from "../../lib/articles";
import { getCategories } from "../../lib/categories";
import { getBylinesWithCounts } from "../../lib/authors";
import { buildUrlset, xmlResponse, type SitemapEntry } from "../../lib/sitemap-xml";

// Category, tag and author archives — the browse surfaces. Real indexable
// landing pages (article tag chips point here rather than at the noindexed
// /search), but they are aggregations of the articles sitemap, so they are
// kept separate from it and asked for less crawl attention.
export const revalidate = 3600;

export async function GET() {
  const [categories, tags, bylines] = await Promise.all([
    getCategories(),
    getAllTagsWithCounts(),
    getBylinesWithCounts(),
  ]);

  const categoryPages: SitemapEntry[] = categories.map((category) => ({
    path: `/category/${category.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const tagPages: SitemapEntry[] = tags.map((t) => ({
    path: `/tag/${encodeURIComponent(t.tag)}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const authorPages: SitemapEntry[] = bylines.map((b) => ({
    path: `/author/${b.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return xmlResponse(buildUrlset([...categoryPages, ...tagPages, ...authorPages]), 3600);
}
