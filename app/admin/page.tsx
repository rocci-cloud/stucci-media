import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Images,
  Mail,
  Mic,
  PenLine,
  Plus,
  Upload,
} from "lucide-react";
import { getAllArticlesAdmin, getArticlesAwaitingReview } from "../lib/articles";
import { getRecentActivity } from "../lib/activity";
import {
  getCalendarEntries,
  getDashboardStats,
  getPublishingActivity,
  getTopArticles,
} from "../lib/dashboard";
import { requireStaffSession } from "../lib/require-admin";
import { canManageAllContent } from "../lib/permissions";
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import ActivityFeed from "./components/ActivityFeed";
import PublishingChart from "./components/PublishingChart";
import ContentCalendar from "./components/ContentCalendar";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { label: "New article", href: "/admin/articles/new", icon: Plus },
  { label: "New episode", href: "/admin/podcast/new", icon: Mic },
  { label: "Upload media", href: "/admin/media", icon: Upload },
  { label: "Schedule a post", href: "/admin/articles/new", icon: Clock },
];

function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href: string;
  icon: typeof FileText;
  accent?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              accent
                ? "bg-[var(--admin-primary)]/10 text-[var(--admin-primary)]"
                : "bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="mt-auto">
            <div className="text-2xl font-bold tabular-nums text-[var(--admin-fg)]">{value}</div>
            <div className="text-[12.5px] text-[var(--admin-fg-muted)]">{label}</div>
            {hint && <div className="mt-0.5 text-[11.5px] text-[var(--admin-fg-muted)]">{hint}</div>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await requireStaffSession();
  const isPublisher = canManageAllContent(session?.user.role);

  const [stats, topArticles, activity, publishing, calendar, recentArticles, awaitingReview] = await Promise.all([
    getDashboardStats(),
    getTopArticles(5),
    getRecentActivity(8),
    getPublishingActivity(30),
    getCalendarEntries(),
    getAllArticlesAdmin(isPublisher || !session ? {} : { authorId: session.user.id }),
    isPublisher ? getArticlesAwaitingReview() : Promise.resolve([]),
  ]);

  const weekDelta = stats.publishedThisWeek - stats.publishedLastWeek;
  const recent = recentArticles.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-[13px] font-medium text-[var(--admin-fg)] transition-colors hover:border-[var(--admin-primary)] hover:text-[var(--admin-primary)]"
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          );
        })}
        <span className="ml-auto hidden text-[11.5px] text-[var(--admin-fg-muted)] sm:block">
          Press <kbd className="rounded border border-[var(--admin-border)] px-1">⌘K</kbd> for anything else
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Published this week"
          value={stats.publishedThisWeek}
          hint={
            stats.publishedLastWeek === 0 && stats.publishedThisWeek === 0
              ? undefined
              : `${weekDelta >= 0 ? "+" : ""}${weekDelta} vs. last week`
          }
          href="/admin/articles"
          icon={CheckCircle2}
          accent
        />
        <StatCard label="Drafts" value={stats.drafts} href="/admin/articles" icon={PenLine} />
        <StatCard
          label="In review"
          value={stats.inReview}
          hint={stats.inReview > 0 ? "Waiting on an editor" : undefined}
          href="/admin/articles"
          icon={FileText}
        />
        <StatCard label="Scheduled" value={stats.scheduled} href="/admin/articles" icon={Clock} />
        <StatCard
          label="Total views"
          value={stats.totalViews.toLocaleString()}
          // viewsThisWeek is null by design — view counts are lifetime
          // totals with no daily series behind them, so there is no honest
          // weekly figure to show until analytics are wired up.
          hint={stats.viewsThisWeek === null ? "All time" : undefined}
          href="/admin/articles"
          icon={Eye}
        />
        <StatCard label="Subscribers" value={stats.subscribers.toLocaleString()} href="/admin/subscribers" icon={Mail} />
      </div>

      {isPublisher && awaitingReview.length > 0 && (
        <Card className="border-[var(--admin-primary)]/40">
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--admin-fg)]">
              Pending approvals
              <Badge variant="primary">{awaitingReview.length}</Badge>
            </h2>
          </div>
          <ul className="divide-y divide-[var(--admin-border)]">
            {awaitingReview.slice(0, 5).map((article) => (
              <li key={article.id}>
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--admin-bg-subtle)]/60"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--admin-fg)]">{article.headline}</div>
                    <div className="text-[12.5px] text-[var(--admin-fg-muted)]">
                      {article.author} · {article.category}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--admin-fg)]">Publishing — last 30 days</h2>
            <span className="text-[12.5px] text-[var(--admin-fg-muted)]">
              {stats.totalArticles} article{stats.totalArticles === 1 ? "" : "s"} total
            </span>
          </div>
          <CardContent className="px-3 py-4">
            <PublishingChart data={publishing} />
          </CardContent>
        </Card>

        <Card>
          <div className="border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--admin-fg)]">Content calendar</h2>
          </div>
          <CardContent className="p-4">
            <ContentCalendar entries={calendar} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--admin-fg)]">Top performing</h2>
            <span className="text-[11.5px] text-[var(--admin-fg-muted)]">by views</span>
          </div>
          {topArticles.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-[var(--admin-fg-muted)]">
              Nothing published yet.
            </div>
          ) : (
            <ol className="divide-y divide-[var(--admin-border)]">
              {topArticles.map((article, index) => (
                <li key={article.id}>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--admin-bg-subtle)]/60"
                  >
                    <span className="w-4 shrink-0 text-[15px] font-bold text-[var(--admin-primary)]/40 tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-[var(--admin-fg)]">{article.headline}</div>
                      <div className="text-[11.5px] text-[var(--admin-fg-muted)]">{article.category}</div>
                    </div>
                    <span className="shrink-0 text-[12.5px] text-[var(--admin-fg-muted)] tabular-nums">
                      {article.viewCount.toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--admin-fg)]">Recently updated</h2>
            <Link href="/admin/articles" className="text-[13px] font-medium text-[var(--admin-primary)] hover:underline">
              View all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-[var(--admin-fg-muted)]">
              No articles yet —{" "}
              <Link href="/admin/articles/new" className="text-[var(--admin-primary)] hover:underline">
                write your first one
              </Link>
              .
            </div>
          ) : (
            <ul className="divide-y divide-[var(--admin-border)]">
              {recent.map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-[var(--admin-bg-subtle)]/60"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-[var(--admin-fg)]">{article.headline}</div>
                      <div className="text-[11.5px] text-[var(--admin-fg-muted)]">
                        {article.category} · {article.date}
                      </div>
                    </div>
                    <Badge
                      variant={
                        article.isScheduled
                          ? "default"
                          : article.status === "published"
                            ? "success"
                            : "outline"
                      }
                      className="shrink-0"
                    >
                      {article.isScheduled ? "Scheduled" : article.status.replace("_", " ")}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--admin-fg)]">Recent activity</h2>
            {stats.trashed > 0 && (
              <Link href="/admin/trash" className="text-[12.5px] text-[var(--admin-fg-muted)] hover:underline">
                {stats.trashed} in trash
              </Link>
            )}
          </div>
          <ActivityFeed entries={activity} />
        </Card>
      </div>

      {stats.pendingComments > 0 && (
        <Link
          href="/admin/comments"
          className="flex items-center gap-2 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-[13px] text-[var(--admin-fg)] transition-colors hover:border-[var(--admin-primary)]"
        >
          <Images className="h-4 w-4 text-[var(--admin-fg-muted)]" />
          {stats.pendingComments} comment{stats.pendingComments === 1 ? "" : "s"} hidden from the site
          <ArrowUpRight className="ml-auto h-4 w-4 text-[var(--admin-fg-muted)]" />
        </Link>
      )}
    </div>
  );
}
