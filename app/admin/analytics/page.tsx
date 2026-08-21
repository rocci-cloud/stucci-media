import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowUp, Clock, Eye, MousePointerClick, Radio, Users } from "lucide-react";
import { requireStaffSession } from "../../lib/require-admin";
import { formatDuration } from "../../lib/analytics-classify";
import {
  getArticlePerformance,
  getAudienceBreakdowns,
  getCategoryPerformance,
  getOverview,
  getRealtime,
  getTopPages,
  getTrafficSeries,
  getTrafficSources,
  hasAnyData,
  resolvePeriod,
} from "../../lib/analytics";
import { Card, CardContent } from "../components/ui/card";
import TrafficChart from "./TrafficChart";
import PeriodTabs from "./PeriodTabs";
import RankedBars from "./RankedBars";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ period?: string }> };

const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct / bookmarks",
  search: "Search engines",
  social: "Social media",
  referral: "Other sites",
  internal: "Within the site",
};

function pct(n: number | null): string {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}

/** Percentage change, or null when there is no baseline to compare against. */
function delta(current: number, previous: number): number | null {
  // No baseline to compare against: showing "+100%" off a zero previous
  // period would be a made-up number, so the delta is simply omitted.
  if (previous === 0) return null;
  return (current - previous) / previous;
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  change,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  hint?: string;
  change?: number | null;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[var(--admin-fg-muted)]">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
        </div>
        <p className="mt-2 text-[26px] font-semibold leading-none text-[var(--admin-fg)] tabular-nums">{value}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          {change != null && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                change >= 0 ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]"
              }`}
            >
              {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(Math.round(change * 100))}%
            </span>
          )}
          {hint && <span className="text-[11px] text-[var(--admin-fg-muted)]">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3">
          <h2 className="text-[13px] font-semibold text-[var(--admin-fg)]">{title}</h2>
          {note && <p className="mt-0.5 text-[11px] text-[var(--admin-fg-muted)]">{note}</p>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage({ searchParams }: Props) {
  // /admin/layout.tsx gates the section, but a page can be requested
  // directly, so each one re-checks for itself (same pattern as every other
  // admin page since roles opened up).
  const session = await requireStaffSession();
  if (!session) redirect("/login?from=%2Fadmin%2Fanalytics");

  const { period: periodKey } = await searchParams;
  const { key, period } = resolvePeriod(periodKey);
  const days = period.days;

  const [overview, series, articles, pages, traffic, audience, categories, realtime, any] = await Promise.all([
    getOverview(days),
    getTrafficSeries(days),
    getArticlePerformance(days, 20),
    getTopPages(days, 15),
    getTrafficSources(days),
    getAudienceBreakdowns(days),
    getCategoryPerformance(days),
    getRealtime(),
    hasAnyData(),
  ]);

  const coverage = overview.engagementCoverage;
  const coveragePct = coverage.total > 0 ? Math.round((coverage.measured / coverage.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--admin-fg)]">Analytics</h1>
          <p className="mt-0.5 text-[12px] text-[var(--admin-fg-muted)]">
            First-party traffic for the whole site, stored in your own database.
          </p>
        </div>
        <PeriodTabs active={key} />
      </div>

      {!any && (
        <Card>
          <CardContent className="p-4">
            <p className="text-[13px] font-medium text-[var(--admin-fg)]">No data collected yet</p>
            <p className="mt-1 text-[12px] text-[var(--admin-fg-muted)]">
              Tracking starts the moment this deploys. Numbers here cover visits from that point on. Views recorded
              before then live on the old per-article counter and are shown on the Dashboard, not here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Right now — deliberately above the range-based numbers, because
          "is anyone reading the thing I just published" is the question this
          page gets opened for most often. */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {realtime.activeVisitors > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--admin-success)] opacity-60" />
              )}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  realtime.activeVisitors > 0 ? "bg-[var(--admin-success)]" : "bg-[var(--admin-fg-muted)]"
                }`}
              />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-[var(--admin-fg)]">
                {realtime.activeVisitors.toLocaleString()} reading now
              </p>
              <p className="text-[11px] text-[var(--admin-fg-muted)]">
                Active in the last 30 minutes · {realtime.viewsLastHour.toLocaleString()} views in the last hour
              </p>
            </div>
          </div>
          {realtime.pages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {realtime.pages.map((p) => (
                <span
                  key={p.path}
                  className="max-w-[220px] truncate rounded-full bg-[var(--admin-bg-subtle)] px-2.5 py-1 text-[11px] text-[var(--admin-fg-muted)]"
                  title={p.path}
                >
                  {p.path} · {p.views}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat
          icon={Eye}
          label="Page views"
          value={overview.pageViews.toLocaleString()}
          change={delta(overview.pageViews, overview.previous.pageViews)}
          hint="vs previous period"
        />
        <Stat
          icon={Users}
          label="Visitors"
          value={overview.visitors.toLocaleString()}
          change={delta(overview.visitors, overview.previous.visitors)}
          hint="counted per day"
        />
        <Stat
          icon={MousePointerClick}
          label="Visits"
          value={overview.sessions.toLocaleString()}
          change={delta(overview.sessions, overview.previous.sessions)}
          hint="vs previous period"
        />
        <Stat
          icon={Clock}
          label="Avg time on page"
          value={formatDuration(overview.avgDurationMs)}
          hint={`${coveragePct}% of views measured`}
        />
        <Stat
          icon={Radio}
          label="Bounce rate"
          value={pct(overview.bounceRate)}
          hint="visits that saw one page"
        />
        <Stat
          icon={Eye}
          label="Avg scroll depth"
          value={overview.avgScrollPct == null ? "—" : `${Math.round(overview.avgScrollPct)}%`}
          hint="how far down they got"
        />
      </div>

      <Panel title="Traffic over time" note={period.label}>
        <TrafficChart data={series} days={days} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Where readers came from" note="Internal clicks are counted separately from fresh arrivals.">
          <RankedBars
            items={traffic.sources.map((s) => ({
              label: SOURCE_LABELS[s.source] ?? s.source,
              value: s.views,
              meta: `${s.visitors.toLocaleString()} visitors`,
            }))}
            emptyMessage="No traffic recorded in this period."
          />
        </Panel>

        <Panel title="Top referring sites" note="Excludes links from within stuccimedia.com.">
          <RankedBars
            items={traffic.referrers.map((r) => ({
              label: r.domain,
              value: r.views,
              meta: `${r.visitors.toLocaleString()} visitors`,
            }))}
            emptyMessage="No outside referrers recorded yet."
          />
        </Panel>
      </div>

      <Panel
        title="Article performance"
        note="Ranked by views. Read time and scroll depth only count views where the reader's browser reported back."
      >
        {articles.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-[var(--admin-fg-muted)]">
            No article views recorded in this period.
          </p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-[11px] uppercase tracking-wide text-[var(--admin-fg-muted)]">
                  <th className="px-2 py-2 font-medium">Article</th>
                  <th className="px-2 py-2 text-right font-medium">Views</th>
                  <th className="px-2 py-2 text-right font-medium">Visitors</th>
                  <th className="px-2 py-2 text-right font-medium">Avg time</th>
                  <th className="px-2 py-2 text-right font-medium">Read through</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.articleId} className="border-b border-[var(--admin-border)] last:border-0">
                    <td className="max-w-[320px] px-2 py-2.5">
                      <Link
                        href={`/articles/${a.slug}`}
                        className="line-clamp-1 text-[13px] font-medium text-[var(--admin-fg)] hover:underline"
                        title={a.headline}
                      >
                        {a.headline}
                      </Link>
                      <span className="text-[11px] text-[var(--admin-fg-muted)]">{a.category}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right text-[13px] font-semibold tabular-nums text-[var(--admin-fg)]">
                      {a.views.toLocaleString()}
                    </td>
                    <td className="px-2 py-2.5 text-right text-[13px] tabular-nums text-[var(--admin-fg-muted)]">
                      {a.visitors.toLocaleString()}
                    </td>
                    <td className="px-2 py-2.5 text-right text-[13px] tabular-nums text-[var(--admin-fg-muted)]">
                      {formatDuration(a.avgDurationMs)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-[13px] tabular-nums text-[var(--admin-fg-muted)]">
                      {pct(a.completionRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Most-visited pages" note="Every page, not just articles.">
          <RankedBars
            items={pages.map((p) => ({
              label: p.path,
              value: p.views,
              meta: formatDuration(p.avgDurationMs),
              href: p.path,
            }))}
            emptyMessage="No page views recorded in this period."
          />
        </Panel>

        <Panel title="Category performance" note="Article views grouped by section.">
          <RankedBars
            items={categories.map((c) => ({
              label: c.category,
              value: c.views,
              meta: formatDuration(c.avgDurationMs),
              href: `/category/${c.slug}`,
            }))}
            emptyMessage="No category traffic recorded yet."
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Panel title="Devices">
          <RankedBars items={audience.devices.map((d) => ({ label: d.label, value: d.views }))} />
        </Panel>
        <Panel title="Browsers">
          <RankedBars items={audience.browsers.map((d) => ({ label: d.label, value: d.views }))} />
        </Panel>
        <Panel title="Operating systems">
          <RankedBars items={audience.systems.map((d) => ({ label: d.label, value: d.views }))} />
        </Panel>
        <Panel title="Countries">
          <RankedBars items={audience.countries.map((d) => ({ label: d.label, value: d.views }))} />
        </Panel>
      </div>

      {/* Stated plainly rather than buried, because these two caveats change
          how several numbers above should be read. */}
      <p className="text-[11px] leading-relaxed text-[var(--admin-fg-muted)]">
        Visitors are identified without cookies, by a salted hash that changes every day, so no consent banner is
        needed and nobody is tracked between days. That means someone who reads on Monday and again on Friday counts
        as a visitor on both days. Time on page and scroll depth are reported by the reader&apos;s browser when they
        leave a page; a reader who closes the tab abruptly may not report back, which is why {coveragePct}% of views
        in this period carry those figures and the averages exclude the rest. Known crawlers and link-preview bots are
        dropped before anything is stored.
      </p>
    </div>
  );
}
