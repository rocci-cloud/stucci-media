import { prisma } from "./prisma";

// Fire-and-forget from a signed-in article view — a lightweight per-
// category counter, not a full reading-history log. Backs the homepage's
// personalized "Recommended For You" rail (see getTopCategorySlugs below,
// consumed by getPersonalizedArticles in lib/articles.ts).
export async function recordCategoryInterest(userId: string, categorySlug: string): Promise<void> {
  await prisma.categoryInterest.upsert({
    where: { userId_categorySlug: { userId, categorySlug } },
    create: { userId, categorySlug, count: 1 },
    update: { count: { increment: 1 } },
  });
}

export async function getTopCategorySlugs(userId: string, limit = 3): Promise<string[]> {
  const rows = await prisma.categoryInterest.findMany({
    where: { userId },
    orderBy: { count: "desc" },
    take: limit,
  });
  return rows.map((r) => r.categorySlug);
}
