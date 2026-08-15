import { redirect } from "next/navigation";
import { requireAdminSession } from "../../lib/require-admin";
import Link from "next/link";
import { Download, Mail } from "lucide-react";
import { getAllSubscribers } from "../../lib/subscribers";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  // Admin-only. The /admin layout now admits editors and authors
  // too, so this section re-checks rather than relying on it.
  if (!(await requireAdminSession())) redirect("/admin");

  const subscribers = await getAllSubscribers();

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
                <TableHead>Subscribed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
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
