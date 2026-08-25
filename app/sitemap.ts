import type { MetadataRoute } from "next";
import { getAllTagsWithCounts, getPublishedArticles } from "./lib/articles";
import { getCategories } from "./lib/categories";
import { getBylinesWithCounts } from "./lib/authors";
import { getActivePodcasts, getEpisodeSitemapEntries } from "./lib/podcasts";

// www, not the apex domain — see the PRODUCTION_URL comment in
// app/lib/auth.ts.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, tags, bylines, podcasts, episodes] = await Promise.all([
    getPublishedArticles(),
    getCategories(),
    getAllTagsWithCounts(),
    getBylinesWithCounts(),
    getActivePodcasts(),
    getEpisodeSitemapEntries(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "hourly", priority: 1 },
    { url: `${siteUrl}/podcasts`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/subscribe`, changeFrequency: "monthly", priority: 0.6 },
    // A commercial landing page, so it gets a high priority: it is one of
    // the few pages on the site meant to be found by search rather than by
    // a reader already here.
    { url: `${siteUrl}/feature-article`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/category/${category.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/articles/${article.slug}`,
    lastModified: article.publishedAt ?? undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Tag archives are real indexable landing pages, so they belong here —
  // article tag chips point at them rather than at the noindexed /search.
  const tagPages: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${siteUrl}/tag/${encodeURIComponent(t.tag)}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const authorPages: MetadataRoute.Sitemap = bylines.map((b) => ({
    url: `${siteUrl}/author/${b.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const podcastPages: MetadataRoute.Sitemap = podcasts.map((p) => ({
    url: `${siteUrl}/podcasts/${p.slug}`,
    lastModified: p.lastFetchedAt ?? undefined,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // Each episode is its own indexable page — the single biggest search
  // surface this section has, since a show has one URL but an archive has
  // hundreds. lastModified is the publish date: feed episodes are not
  // edited in place here, they are replaced wholesale on refresh.
  const episodePages: MetadataRoute.Sitemap = episodes.map((e) => ({
    url: `${siteUrl}/podcasts/${e.showSlug}/${e.episodeSlug}`,
    ...(e.publishedAt ? { lastModified: e.publishedAt } : {}),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...tagPages,
    ...authorPages,
    ...podcastPages,
    ...episodePages,
    ...articlePages,
  ];
}
