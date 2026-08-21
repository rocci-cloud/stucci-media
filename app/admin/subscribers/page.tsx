import { redirect } from "next/navigation";
import { requireAdminSession } from "../../lib/require-admin";
import Link from "next/link";
import { Download, Mail } from "lucide-react";
import {
  getAllSubscribers,
  getRecentSubscriberCount,
  getSubscriberSourceCounts,
  subscriberSourceLabel,
} from "../../lib/subscribers";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  // Admin-only. The /admin layout now admits editors and authors
  // too, so this section re-checks rather than relying on it.
  if (!(await requireAdminSession())) redirect("/admin");

  const [subscribers, sourceCounts, last7, last30] = await Promise.all([
    getAllSubscribers(),
    getSubscriberSourceCounts(),
    getRecentSubscriberCount(7),
    getRecentSubscriberCount(30),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin"
            className="text-[13px] font-medium text-[var(--admin-fg-muted)] hover:text-[var(--admin-fg)]"
          >
            ← Dashboard
          </Link>
          <p className="mt-1 text-[13px] text-[var(--admin-fg-muted)]">
            {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild size="sm">
          <a href="/api/admin/subscribers/export">
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total", value: subscribers.length },
          { label: "Last 7 days", value: last7 },
          { label: "Last 30 days", value: last30 },
          { label: "Capture points", value: sourceCounts.length },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--admin-fg-muted)]">
                {stat.label}
              </p>
              <p className="mt-1.5 text-[24px] font-semibold leading-none tabular-nums text-[var(--admin-fg)]">
                {stat.value.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Which capture point is actually earning signups. Without this the
          list is just addresses with no idea what produced them, which makes
          it impossible to tell whether a placement is worth keeping. */}
      {sourceCounts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-[13px] font-semibold text-[var(--admin-fg)]">Where signups came from</h2>
            <p className="mt-0.5 text-[11px] text-[var(--admin-fg-muted)]">
              Anyone who signed up before this was tracked shows as &ldquo;Before tracking&rdquo;.
            </p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {sourceCounts.map((row) => {
                const pct = subscribers.length > 0 ? Math.round((row.count / subscribers.length) * 100) : 0;
                return (
                  <li
                    key={row.source ?? "untracked"}
                    className="relative flex items-center gap-3 rounded-md px-2 py-1.5"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 rounded-md"
                      style={{ width: `${Math.max(2, pct)}%`, background: "var(--admin-chart-2-soft)" }}
                    />
                    <span className="relative min-w-0 flex-1 truncate text-[13px] text-[var(--admin-fg)]">
                      {subscriberSourceLabel(row.source)}
                    </span>
                    <span className="relative shrink-0 text-[12px] tabular-nums text-[var(--admin-fg-muted)]">
                      {pct}%
                    </span>
                    <span className="relative shrink-0 text-[13px] font-semibold tabular-nums text-[var(--admin-fg)]">
                      {row.count.toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {subscribers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
            <Mail className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-[var(--admin-fg)]">No subscribers yet</p>
          <p className="text-[13px] text-[var(--admin-fg-muted)]">
            They&apos;ll show up here as readers sign up on the site.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Subscribed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell className="text-[var(--admin-fg-muted)]">{subscriberSourceLabel(s.source)}</TableCell>
                  <TableCell className="text-[var(--admin-fg-muted)]">
                    {new Date(s.subscribedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
