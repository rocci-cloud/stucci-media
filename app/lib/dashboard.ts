import { prisma } from "./prisma";

export type DashboardStats = {
  publishedThisWeek: number;
  publishedLastWeek: number;
  drafts: number;
  inReview: number;
  scheduled: number;
  totalArticles: number;
  totalViews: number;
  viewsThisWeek: number | null;
  subscribers: number;
  pendingComments: number;
  trashed: number;
};

export type TopArticle = {
  id: number;
  headline: string;
  slug: string;
  viewCount: number;
  category: string;
  publishedAt: string | null;
};

export type PublishingDay = { date: string; label: string; published: number };

export type CalendarEntry = {
  id: number;
  headline: string;
  date: string; // ISO date (yyyy-mm-dd), local
  status: "published" | "scheduled";
};

function startOfDayUtc(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const weekAgo = startOfDayUtc(7);
  const twoWeeksAgo = startOfDayUtc(14);

  const [
    publishedThisWeek,
    publishedLastWeek,
    drafts,
    inReview,
    scheduled,
    totalArticles,
    viewAgg,
    subscribers,
    pendingComments,
    trashed,
  ] = await Promise.all([
    prisma.article.count({
      where: { status: "PUBLISHED", deletedAt: null, publishedAt: { gte: weekAgo, lte: now } },
    }),
    prisma.article.count({
      where: { status: "PUBLISHED", deletedAt: null, publishedAt: { gte: twoWeeksAgo, lt: weekAgo } },
    }),
    prisma.article.count({ where: { status: "DRAFT", deletedAt: null } }),
    prisma.article.count({ where: { status: "IN_REVIEW", deletedAt: null } }),
    prisma.article.count({ where: { status: "PUBLISHED", deletedAt: null, publishedAt: { gt: now } } }),
    prisma.article.count({ where: { deletedAt: null } }),
    prisma.article.aggregate({ where: { deletedAt: null }, _sum: { viewCount: true } }),
    prisma.subscriber.count(),
    prisma.comment.count({ where: { isApproved: false } }),
    prisma.article.count({ where: { deletedAt: { not: null } } }),
  ]);

  return {
    publishedThisWeek,
    publishedLastWeek,
    drafts,
    inReview,
    scheduled,
    totalArticles,
    totalViews: viewAgg._sum.viewCount ?? 0,
    // Views are a lifetime counter per article (see
    // incrementArticleViewCount) with no per-day time series behind them,
    // so a real "views this week" number can't be derived. Returning null
    // rather than a plausible-looking guess keeps the dashboard honest;
    // the UI renders it as "—" with a note. Wiring Vercel Analytics or
    // Plausible is what would fill this in.
    viewsThisWeek: null,
    subscribers,
    pendingComments,
    trashed,
  };
}

export async function getTopArticles(limit = 5): Promise<TopArticle[]> {
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() } },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: { id: true, headline: true, slug: true, viewCount: true, categorySlug: true, publishedAt: true },
  });

  const categories = await prisma.category.findMany({ select: { slug: true, name: true } });
  const labelBySlug = new Map(categories.map((c) => [c.slug, c.name]));

  return rows.map((r) => ({
    id: r.id,
    headline: r.headline,
    slug: r.slug,
    viewCount: r.viewCount,
    category: labelBySlug.get(r.categorySlug) ?? r.categorySlug,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
  }));
}

/** Publishing volume per day for the last `days` days — the dashboard chart. */
export async function getPublishingActivity(days = 30): Promise<PublishingDay[]> {
  const since = startOfDayUtc(days - 1);
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED", deletedAt: null, publishedAt: { gte: since, lte: new Date() } },
    select: { publishedAt: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.publishedAt) continue;
    const key = row.publishedAt.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const out: PublishingDay[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = startOfDayUtc(i);
    const key = day.toISOString().slice(0, 10);
    out.push({
      date: key,
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      published: counts.get(key) ?? 0,
    });
  }
  return out;
}

/**
 * Everything with a date on it in a window around today — what the
 * content calendar renders. Includes scheduled (future publishedAt)
 * articles, which is the whole point of having a calendar.
 */
export async function getCalendarEntries(daysBack = 14, daysForward = 21): Promise<CalendarEntry[]> {
  const from = startOfDayUtc(daysBack);
  const to = startOfDayUtc(-daysForward);
  const now = new Date();

  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED", deletedAt: null, publishedAt: { gte: from, lte: to } },
    orderBy: { publishedAt: "asc" },
    select: { id: true, headline: true, publishedAt: true },
  });

  return rows
    .filter((r) => r.publishedAt !== null)
    .map((r) => ({
      id: r.id,
      headline: r.headline,
      date: r.publishedAt!.toISOString().slice(0, 10),
      status: (r.publishedAt! > now ? "scheduled" : "published") as CalendarEntry["status"],
    }));
}
