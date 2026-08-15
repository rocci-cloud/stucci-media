"use client";

import { useState, useTransition } from "react";
import { History, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/cn";
import { restoreRevisionAction, diffRevisionAction } from "./actions";
import type { ArticleRevision, DiffLine } from "../../lib/revisions";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default function RevisionHistory({
  articleId,
  revisions,
  current,
}: {
  articleId: number;
  revisions: ArticleRevision[];
  current: { headline: string; dek: string; body: string };
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [diff, setDiff] = useState<DiffLine[] | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function toggle(revision: ArticleRevision) {
    if (openId === revision.id) {
      setOpenId(null);
      setDiff(null);
      return;
    }
    setOpenId(revision.id);
    setDiff(null);
    setLoadingDiff(true);
    try {
      const result = await diffRevisionAction(articleId, revision.id);
      if (!result.success) {
        toast.error(result.error);
        setOpenId(null);
        return;
      }
      setDiff(result.diff);
    } catch {
      toast.error("Couldn't load that diff.");
      setOpenId(null);
    } finally {
      setLoadingDiff(false);
    }
  }

  async function restore(revision: ArticleRevision) {
    setRestoring(revision.id);
    const result = await restoreRevisionAction(articleId, revision.id);
    setRestoring(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Restored. The editor will reload with that version.");
    startTransition(() => window.location.reload());
  }

  if (revisions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-[var(--admin-border)] py-10 text-center">
        <History className="h-6 w-6 text-[var(--admin-fg-muted)]" />
        <p className="text-sm font-medium text-[var(--admin-fg)]">No revisions yet</p>
        <p className="max-w-sm text-[12.5px] text-[var(--admin-fg-muted)]">
          Every save adds a snapshot here, and the editor autosaves a checkpoint while you write.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12.5px] text-[var(--admin-fg-muted)]">
        Comparing each revision against the article as it stands right now. Restoring only changes the headline,
        excerpt, and body — publish status, SEO, and categories are left alone.
      </p>

      <ul className="divide-y divide-[var(--admin-border)] rounded-md border border-[var(--admin-border)]">
        {revisions.map((revision, index) => {
          const isOpen = openId === revision.id;
          const unchanged =
            revision.headline === current.headline &&
            revision.dek === current.dek &&
            revision.body === current.body;

          return (
            <li key={revision.id}>
              <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => toggle(revision)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium text-[var(--admin-fg)]">
                      {formatWhen(revision.createdAt)}
                    </span>
                    {index === 0 && <Badge variant="success">Latest</Badge>}
                    {revision.isAutosave && <Badge variant="outline">Autosave</Badge>}
                    {revision.note && <Badge variant="outline">{revision.note}</Badge>}
                    {unchanged && <Badge variant="outline">Matches current</Badge>}
                  </div>
                  <div className="truncate text-[12px] text-[var(--admin-fg-muted)]">
                    {revision.authorName} · {revision.headline}
                  </div>
                </button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={restoring !== null || unchanged}
                  onClick={() => restore(revision)}
                >
                  {restoring === revision.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Restore
                </Button>
              </div>

              {isOpen && (
                <div className="border-t border-[var(--admin-border)] bg-[var(--admin-bg-subtle)]/40 px-3 py-2.5">
                  {loadingDiff ? (
                    <div className="flex items-center gap-2 text-[12.5px] text-[var(--admin-fg-muted)]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Building diff…
                    </div>
                  ) : diff && diff.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto font-mono text-[12px] leading-relaxed">
                      {diff.map((line, i) => (
                        <div
                          key={i}
                          className={cn(
                            "px-2 py-0.5",
                            line.type === "added" && "bg-[var(--admin-success-bg)] text-[var(--admin-success)]",
                            line.type === "removed" &&
                              "bg-[var(--admin-danger-bg)] text-[var(--admin-danger)] line-through decoration-1",
                            line.type === "same" && "text-[var(--admin-fg-muted)]"
                          )}
                        >
                          <span className="mr-2 select-none opacity-60">
                            {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
                          </span>
                          {line.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12.5px] text-[var(--admin-fg-muted)]">
                      No differences from the current version.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
