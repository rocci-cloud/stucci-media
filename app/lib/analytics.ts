import { prisma } from "./prisma";
import type { TrafficSource } from "./analytics-classify";

/**
 * Read side of the analytics system. Everything here reads `page_views`,
 * written by app/api/analytics/collect.
 *
 * A note that matters for reading every "visitors" number in the dashboard:
 * visitor identity is a salted hash that rotates at UTC midnight (see the
 * collector), so a distinct-visitor count over a multi-day range is the sum
 * of each day's unique visitors. Somebody who reads the site on Monday and
 * again on Thursday is two. That is the deliberate cost of not tracking
 * people across days with a cookie, and it is stated in the UI rather than
 * quietly presented as something it is not.
 */

export type Period = { days: number; label: string };

export const PERIODS: Record<string, Period> = {
  "24h": { days: 1, label: "Last 24 hours" },
  "7d": { days: 7, label: "Last 7 days" },
  "30d": { days: 30, label: "Last 30 days" },
  "90d": { days: 90, label: "Last 90 days" },
  "365d": { days: 365, label: "Last 12 months" },
};

export function resolvePeriod(key: string | undefined): { key: string; period: Period } {
  const k = key && key in PERIODS ? key : "30d";
  return { key: k, period: PERIODS[k] };
}

function since(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export type Overview = {
  pageViews: number;
  visitors: number;
  sessions: number;
  avgDurationMs: number | null;
  avgScrollPct: number | null;
  bounceRate: number | null;
  viewsPerSession: number | null;
  /** Same metrics for the immediately preceding window, for deltas. */
  previous: {
    pageViews: number;
    visitors: number;
    sessions: number;
    avgDurationMs: number | null;
  };
  /** How many views carry engagement data — the honesty check on averages. */
  engagementCoverage: { measured: number; total: number };
};

type CountRow = { n: bigint | number };
type AvgRow = { avg: number | null };

function num(v: bigint | number | null | undefined): number {
  return typeof v === "bigint" ? Number(v) : (v ?? 0);
}

async function windowStats(from: Date, to: Date) {
  const [views, visitors, sessions, dur] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: from, lt: to } } }),
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT visitor_hash)::int AS n
      FROM page_views WHERE created_at >= ${from} AND created_at < ${to}
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT session_id)::int AS n
      FROM page_views WHERE created_at >= ${from} AND created_at < ${to}
    `,
    prisma.$queryRaw<AvgRow[]>`
      SELECT AVG(duration_ms)::float AS avg
      FROM page_views
      WHERE created_at >= ${from} AND created_at < ${to} AND duration_ms IS NOT NULL
    `,
  ]);
  return {
    pageViews: views,
    visitors: num(visitors[0]?.n),
    sessions: num(sessions[0]?.n),
    avgDurationMs: dur[0]?.avg ?? null,
  };
}

export async function getOverview(days: number): Promise<Overview> {
  const now = new Date();
  const from = since(days);
  const prevFrom = since(days * 2);

  const [current, previous, scroll, bounce, coverage] = await Promise.all([
    windowStats(from, now),
    windowStats(prevFrom, from),
    prisma.$queryRaw<AvgRow[]>`
      SELECT AVG(scroll_pct)::float AS avg
      FROM page_views WHERE created_at >= ${from} AND scroll_pct IS NOT NULL
    `,
    // A bounce is a visit that saw exactly one page. Computed from the
    // session grouping rather than stored, so it can never drift.
    prisma.$queryRaw<{ bounced: bigint | number; total: bigint | number }[]>`
      SELECT
        COUNT(*) FILTER (WHERE views = 1)::int AS bounced,
        COUNT(*)::int AS total
      FROM (
        SELECT session_id, COUNT(*) AS views
        FROM page_views WHERE created_at >= ${from}
        GROUP BY session_id
      ) s
    `,
    prisma.$queryRaw<{ measured: bigint | number; total: bigint | number }[]>`
      SELECT
        COUNT(*) FILTER (WHERE duration_ms IS NOT NULL)::int AS measured,
        COUNT(*)::int AS total
      FROM page_views WHERE created_at >= ${from}
    `,
  ]);

  const bouncedTotal = num(bounce[0]?.total);
  const coverageTotal = num(coverage[0]?.total);

  return {
    ...current,
    avgScrollPct: scroll[0]?.avg ?? null,
    bounceRate: bouncedTotal > 0 ? num(bounce[0]?.bounced) / bouncedTotal : null,
    viewsPerSession: current.sessions > 0 ? current.pageViews / current.sessions : null,
    previous,
    engagementCoverage: { measured: num(coverage[0]?.measured), total: coverageTotal },
  };
}

export type TrafficPoint = { date: string; label: string; views: number; visitors: number };

/** Daily views and visitors, with zero-filled gaps so the chart has no holes. */
export async function getTrafficSeries(days: number): Promise<TrafficPoint[]> {
  const from = since(days);
  const rows = await prisma.$queryRaw<{ day: Date; views: bigint | number; visitors: bigint | number }[]>`
    SELECT
      date_trunc('day', created_at) AS day,
      COUNT(*)::int AS views,
      COUNT(DISTINCT visitor_hash)::int AS visitors
    FROM page_views
    WHERE created_at >= ${from}
    GROUP BY 1
    ORDER BY 1
  `;

  const byDay = new Map<string, { views: number; visitors: number }>();
  for (const r of rows) {
    const key = new Date(r.day).toISOString().slice(0, 10);
    byDay.set(key, { views: num(r.views), visitors: num(r.visitors) });
  }

  const out: TrafficPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.get(key) ?? { views: 0, visitors: 0 };
    out.push({
      date: key,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...hit,
    });
  }
  return out;
}

export type ArticlePerformance = {
  articleId: number;
  slug: string;
  headline: string;
  category: string;
  views: number;
  visitors: number;
  avgDurationMs: number | null;
  avgScrollPct: number | null;
  /** Share of reads that got past 75% of the page. */
  completionRate: number | null;
};

export async function getArticlePerformance(days: number, limit = 25): Promise<ArticlePerformance[]> {
  const from = since(days);
  const rows = await prisma.$queryRaw<
    {
      article_id: number;
      views: bigint | number;
      visitors: bigint | number;
      avg_duration: number | null;
      avg_scroll: number | null;
      completed: bigint | number;
      scroll_measured: bigint | number;
    }[]
  >`
    SELECT
      article_id,
      COUNT(*)::int AS views,
      COUNT(DISTINCT visitor_hash)::int AS visitors,
      AVG(duration_ms)::float AS avg_duration,
      AVG(scroll_pct)::float AS avg_scroll,
      COUNT(*) FILTER (WHERE scroll_pct >= 75)::int AS completed,
      COUNT(*) FILTER (WHERE scroll_pct IS NOT NULL)::int AS scroll_measured
    FROM page_views
    WHERE created_at >= ${from} AND article_id IS NOT NULL
    GROUP BY article_id
    ORDER BY views DESC
    LIMIT ${limit}
  `;
  if (rows.length === 0) return [];

  const articles = await prisma.article.findMany({
    where: { id: { in: rows.map((r) => r.article_id) } },
    select: { id: true, slug: true, headline: true, categorySlug: true },
  });
  const byId = new Map(articles.map((a) => [a.id, a]));

  const categories = await prisma.category.findMany({ select: { slug: true, name: true } });
  const labelBySlug = new Map(categories.map((c) => [c.slug, c.name]));

  return rows.flatMap((r) => {
    const a = byId.get(r.article_id);
    if (!a) return [];
    const measured = num(r.scroll_measured);
    return [
      {
        articleId: r.article_id,
        slug: a.slug,
        headline: a.headline,
        category: labelBySlug.get(a.categorySlug) ?? a.categorySlug,
        views: num(r.views),
        visitors: num(r.visitors),
        avgDurationMs: r.avg_duration,
        avgScrollPct: r.avg_scroll,
        completionRate: measured > 0 ? num(r.completed) / measured : null,
      },
    ];
  });
}

export type PageRow = { path: string; pageType: string; views: number; visitors: number; avgDurationMs: number | null };

export async function getTopPages(days: number, limit = 20): Promise<PageRow[]> {
  const from = since(days);
  const rows = await prisma.$queryRaw<
    { path: string; page_type: string; views: bigint | number; visitors: bigint | number; avg_duration: number | null }[]
  >`
    SELECT path, MIN(page_type) AS page_type,
           COUNT(*)::int AS views,
           COUNT(DISTINCT visitor_hash)::int AS visitors,
           AVG(duration_ms)::float AS avg_duration
    FROM page_views
    WHERE created_at >= ${from}
    GROUP BY path
    ORDER BY views DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    path: r.path,
    pageType: r.page_type,
    views: num(r.views),
    visitors: num(r.visitors),
    avgDurationMs: r.avg_duration,
  }));
}

export type SourceRow = { source: TrafficSource | string; views: number; visitors: number };
export type ReferrerRow = { domain: string; views: number; visitors: number };

export async function getTrafficSources(days: number): Promise<{ sources: SourceRow[]; referrers: ReferrerRow[] }> {
  const from = since(days);
  const [sources, referrers] = await Promise.all([
    prisma.$queryRaw<{ source: string; views: bigint | number; visitors: bigint | number }[]>`
      SELECT source, COUNT(*)::int AS views, COUNT(DISTINCT visitor_hash)::int AS visitors
      FROM page_views WHERE created_at >= ${from}
      GROUP BY source ORDER BY views DESC
    `,
    prisma.$queryRaw<{ referrer_domain: string; views: bigint | number; visitors: bigint | number }[]>`
      SELECT referrer_domain, COUNT(*)::int AS views, COUNT(DISTINCT visitor_hash)::int AS visitors
      FROM page_views
      WHERE created_at >= ${from} AND referrer_domain IS NOT NULL AND source <> 'internal'
      GROUP BY referrer_domain ORDER BY views DESC LIMIT 15
    `,
  ]);
  return {
    sources: sources.map((r) => ({ source: r.source, views: num(r.views), visitors: num(r.visitors) })),
    referrers: referrers.map((r) => ({ domain: r.referrer_domain, views: num(r.views), visitors: num(r.visitors) })),
  };
}

export type BreakdownRow = { label: string; views: number };

async function breakdown(column: "device" | "browser" | "os" | "country", days: number, limit: number): Promise<BreakdownRow[]> {
  const from = since(days);
  // The column name is chosen from a closed set above, never from input.
  const rows = await prisma.$queryRawUnsafe<{ label: string | null; views: bigint | number }[]>(
    `SELECT ${column} AS label, COUNT(*)::int AS views
     FROM page_views WHERE created_at >= $1
     GROUP BY 1 ORDER BY views DESC LIMIT $2`,
    from,
    limit,
  );
  return rows.map((r) => ({ label: r.label ?? "Unknown", views: num(r.views) }));
}

export async function getAudienceBreakdowns(days: number): Promise<{
  devices: BreakdownRow[];
  browsers: BreakdownRow[];
  systems: BreakdownRow[];
  countries: BreakdownRow[];
}> {
  const [devices, browsers, systems, countries] = await Promise.all([
    breakdown("device", days, 5),
    breakdown("browser", days, 8),
    breakdown("os", days, 8),
    breakdown("country", days, 12),
  ]);
  return { devices, browsers, systems, countries };
}

export type CategoryPerformance = { category: string; slug: string; views: number; avgDurationMs: number | null };

export async function getCategoryPerformance(days: number): Promise<CategoryPerformance[]> {
  const from = since(days);
  const rows = await prisma.$queryRaw<
    { category_slug: string; views: bigint | number; avg_duration: number | null }[]
  >`
    SELECT a.category_slug, COUNT(*)::int AS views, AVG(pv.duration_ms)::float AS avg_duration
    FROM page_views pv
    JOIN articles a ON a.id = pv.article_id
    WHERE pv.created_at >= ${from}
    GROUP BY a.category_slug
    ORDER BY views DESC
  `;
  const categories = await prisma.category.findMany({ select: { slug: true, name: true } });
  const labelBySlug = new Map(categories.map((c) => [c.slug, c.name]));
  return rows.map((r) => ({
    slug: r.category_slug,
    category: labelBySlug.get(r.category_slug) ?? r.category_slug,
    views: num(r.views),
    avgDurationMs: r.avg_duration,
  }));
}

export type Realtime = { activeVisitors: number; viewsLastHour: number; pages: { path: string; views: number }[] };

/** Who is on the site right now — the last 30 minutes. */
export async function getRealtime(): Promise<Realtime> {
  const halfHour = new Date(Date.now() - 30 * 60 * 1000);
  const hour = new Date(Date.now() - 60 * 60 * 1000);
  const [active, lastHour, pages] = await Promise.all([
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT visitor_hash)::int AS n FROM page_views WHERE created_at >= ${halfHour}
    `,
    prisma.pageView.count({ where: { createdAt: { gte: hour } } }),
    prisma.$queryRaw<{ path: string; views: bigint | number }[]>`
      SELECT path, COUNT(*)::int AS views FROM page_views
      WHERE created_at >= ${halfHour} GROUP BY path ORDER BY views DESC LIMIT 5
    `,
  ]);
  return {
    activeVisitors: num(active[0]?.n),
    viewsLastHour: lastHour,
    pages: pages.map((p) => ({ path: p.path, views: num(p.views) })),
  };
}

/** Whether any data exists at all, so the UI can explain an empty dashboard. */
export async function hasAnyData(): Promise<boolean> {
  // findFirst, not count: this only needs to know whether the table is
  // empty, and a full count over a growing event table to answer that
  // would get slower every week.
  return (await prisma.pageView.findFirst({ select: { id: true } })) !== null;
}
