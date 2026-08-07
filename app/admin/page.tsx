import Link from "next/link";
import { FileText, FolderTree, Mail, CheckCircle2, PenLine } from "lucide-react";
import { getAllArticlesAdmin } from "../lib/articles";
import { getCategories } from "../lib/categories";
import { getAllSubscribers } from "../lib/subscribers";
import { getRecentActivity } from "../lib/activity";
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import ActivityFeed from "./components/ActivityFeed";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [articles, categories, subscribers, activity] = await Promise.all([
    getAllArticlesAdmin(),
    getCategories(),
    getAllSubscribers(),
    getRecentActivity(8),
  ]);

  const published = articles.filter((a) => a.status === "published").length;
  const drafts = articles.length - published;
  const recent = articles.slice(0, 6);

  const stats = [
    { label: "Total articles", value: articles.length, icon: FileText, href: "/admin/articles" },
    { label: "Published", value: published, icon: CheckCircle2, href: "/admin/articles" },
    { label: "Drafts", value: drafts, icon: PenLine, href: "/admin/articles" },
    { label: "Categories", value: categories.length, icon: FolderTree, href: "/admin/categories" },
    { label: "Subscribers", value: subscribers.length, icon: Mail, href: "/admin/subscribers" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tabular-nums text-[var(--admin-fg)]">{stat.value}</div>
                    <div className="text-[12.5px] text-[var(--admin-fg-muted)]">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--admin-fg)]">Recently updated</h2>
            <Link href="/admin/articles" className="text-[13px] font-medium text-[var(--admin-primary)] hover:underline">
              View all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-[var(--admin-fg-muted)]">
              No articles yet — <Link href="/admin/articles/new" className="text-[var(--admin-primary)] hover:underline">write your first one</Link>.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--admin-border)]">
              {recent.map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--admin-bg-subtle)]/60"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--admin-fg)]">{article.headline}</div>
                      <div className="text-[12.5px] text-[var(--admin-fg-muted)]">
                        {article.category} · {article.date}
                      </div>
                    </div>
                    <Badge variant={article.status === "published" ? "success" : "outline"} className="shrink-0">
                      {article.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--admin-fg)]">Recent activity</h2>
          </div>
          <ActivityFeed entries={activity} />
        </Card>
      </div>
    </div>
  );
}
