import { MessageSquare } from "lucide-react";

export default function CommentsPage() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
        <MessageSquare className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[var(--admin-fg)]">Comment moderation is coming soon</p>
        <p className="max-w-sm text-[13px] text-[var(--admin-fg-muted)]">
          The database is ready — articles can already receive threaded, moderatable comments — but
          there&apos;s no public comment form or moderation queue wired up yet.
        </p>
      </div>
    </div>
  );
}
