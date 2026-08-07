import { FilePlus, FilePen, FileX, Sparkles, FolderPlus, FolderPen, FolderX, MessageSquareCheck, MessageSquareX, ListChecks } from "lucide-react";
import type { ActivityEntry } from "../../lib/activity";

const ACTION_META: Record<string, { label: (target: string) => string; icon: React.ComponentType<{ className?: string }> }> = {
  "article.created": { label: (t) => `Created "${t}"`, icon: FilePlus },
  "article.updated": { label: (t) => `Updated "${t}"`, icon: FilePen },
  "article.deleted": { label: (t) => `Deleted "${t}"`, icon: FileX },
  "article.featured": { label: (t) => `Featured "${t}"`, icon: Sparkles },
  "article.unfeatured": { label: (t) => `Unfeatured "${t}"`, icon: Sparkles },
  "article.recategorized": { label: (t) => `Recategorized "${t}"`, icon: FilePen },
  "article.bulk_published": { label: (t) => `Published ${t}`, icon: ListChecks },
  "article.bulk_unpublished": { label: (t) => `Unpublished ${t}`, icon: ListChecks },
  "article.bulk_deleted": { label: (t) => `Deleted ${t}`, icon: ListChecks },
  "article.bulk_featured": { label: (t) => `Featured ${t}`, icon: ListChecks },
  "article.bulk_unfeatured": { label: (t) => `Unfeatured ${t}`, icon: ListChecks },
  "article.bulk_recategorized": { label: (t) => `Recategorized ${t}`, icon: ListChecks },
  "category.created": { label: (t) => `Created category "${t}"`, icon: FolderPlus },
  "category.updated": { label: (t) => `Updated category "${t}"`, icon: FolderPen },
  "category.deleted": { label: (t) => `Deleted category "${t}"`, icon: FolderX },
  "comment.approved": { label: () => `Approved a comment`, icon: MessageSquareCheck },
  "comment.hidden": { label: () => `Hid a comment`, icon: MessageSquareX },
  "comment.deleted": { label: () => `Deleted a comment`, icon: MessageSquareX },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-[13px] text-[var(--admin-fg-muted)]">
        Admin actions (publishing, editing, moderation) will show up here.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--admin-border)]">
      {entries.map((entry) => {
        const meta = ACTION_META[entry.action];
        const Icon = meta?.icon ?? FilePen;
        const label = meta ? meta.label(entry.targetLabel) : `${entry.action} — ${entry.targetLabel}`;
        return (
          <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
              <Icon className="h-[14px] w-[14px]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] text-[var(--admin-fg)]">{label}</p>
              <p className="text-[12px] text-[var(--admin-fg-muted)]">
                {entry.actorName} · {relativeTime(entry.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
