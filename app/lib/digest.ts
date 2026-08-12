import { prisma } from "./prisma";
import { getCategories } from "./categories";
import { getTopCategorySlugs } from "./interests";
import type { Article } from "./articles";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DIGEST_SIZE = 5;

// Same shape lib/articles.ts's mapRow builds, but scoped down to what the
// digest actually renders — no need to pull SEO/comparison fields for an
// email preview.
export type DigestArticle = Pick<
  Article,
  "id" | "slug" | "headline" | "dek" | "category" | "coverImageUrl" | "date" | "author"
>;

function mapDigestRow(
  row: { id: number; slug: string; headline: string; dek: string; categorySlug: string; coverImageUrl: string | null; publishedAt: Date | null; author: string },
  labelBySlug: Map<string, string>
): DigestArticle {
  return {
    id: row.id,
    slug: row.slug,
    headline: row.headline,
    dek: row.dek,
    category: labelBySlug.get(row.categorySlug) ?? row.categorySlug,
    coverImageUrl: row.coverImageUrl,
    date: row.publishedAt
      ? row.publishedAt.toLocaleDateString("en-US", { month: "long", day: "numeric" })
      : "",
    author: row.author,
  };
}

async function categorySlugToLabel(): Promise<Map<string, string>> {
  const cats = await getCategories();
  return new Map(cats.map((c) => [c.slug, c.label]));
}

// Sitewide fallback: the week's most-read published articles, newest
// first among ties. Used both as the non-personalized "general" digest
// and to top up a reader's personalized picks when they haven't read
// enough categories yet to fill a full digest.
export async function getTopArticlesThisWeek(limit = DIGEST_SIZE, excludeIds: number[] = []): Promise<DigestArticle[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: new Date(Date.now() - WEEK_MS), lte: new Date() },
        id: { notIn: excludeIds },
      },
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      take: limit,
    }),
    categorySlugToLabel(),
  ]);
  return rows.map((r) => mapDigestRow(r, labelBySlug));
}

// A reader's personalized weekly picks: this week's published articles in
// whichever categories they actually read the most (see
// getTopCategorySlugs), topped up with this week's sitewide top picks if
// their own categories don't have enough to fill a full digest — same
// "never sparse" pattern getRelatedArticles already uses in lib/articles.ts.
export async function getWeeklyDigestForUser(userId: string, limit = DIGEST_SIZE): Promise<DigestArticle[]> {
  const topSlugs = await getTopCategorySlugs(userId, 3);
  if (topSlugs.length === 0) return getTopArticlesThisWeek(limit);

  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: new Date(Date.now() - WEEK_MS), lte: new Date() },
        categorySlug: { in: topSlugs },
      },
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      take: limit,
    }),
    categorySlugToLabel(),
  ]);
  const picks = rows.map((r) => mapDigestRow(r, labelBySlug));

  if (picks.length < limit) {
    const filler = await getTopArticlesThisWeek(limit - picks.length, picks.map((p) => p.id));
    picks.push(...filler);
  }
  return picks;
}

// Readers with at least one recorded category interest — the pool the
// admin preview can pick a real example from, since personalization only
// means something for a reader with actual reading history.
export async function getReadersWithInterests(limit = 25): Promise<{ id: string; name: string; email: string }[]> {
  const interests = await prisma.categoryInterest.findMany({
    distinct: ["userId"],
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: { user: { select: { id: true, name: true, email: true } } },
  });
  return interests.map((i) => i.user);
}
