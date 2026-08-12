"use client";

import { useState, useTransition } from "react";
import { Radio, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { addLiveBlogEntryAction, deleteLiveBlogEntryAction } from "./actions";
import type { LiveBlogEntry } from "../../lib/live-blog";

type Props = {
  articleId: number;
  initialEntries: LiveBlogEntry[];
};

export default function LiveBlogPanel({ articleId, initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addLiveBlogEntryAction(articleId, headline, body);
      if (result.success) {
        setEntries([
          { id: `temp-${Date.now()}`, headline: headline.trim() || null, bodyHtml: `<p>${body.trim()}</p>`, createdAt: new Date().toISOString() },
          ...entries,
        ]);
        setHeadline("");
        setBody("");
        toast.success("Live blog update posted.");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(entryId: string) {
    const previous = entries;
    setEntries(entries.filter((e) => e.id !== entryId));
    startTransition(async () => {
      const result = await deleteLiveBlogEntryAction(entryId, articleId);
      if (!result.success) {
        setEntries(previous);
        toast.error(result.error);
      } else {
        toast.success("Update removed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 rounded-md border border-[var(--admin-border)] bg-[var(--admin-primary)]/5 px-3.5 py-2.5 text-[13px] text-[var(--admin-fg-muted)]">
        <Radio className="h-4 w-4 shrink-0 text-[var(--admin-primary)]" />
        Post timestamped updates below — newest shows first on the public page, with a pulsing LIVE badge.
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-[var(--admin-border)] p-4">
        <Label htmlFor="live-blog-headline">Update headline (optional)</Label>
        <Input
          id="live-blog-headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={120}
          placeholder="Statement released, polls close, etc."
        />
        <Label htmlFor="live-blog-body" className="mt-2">
          Update text
        </Label>
        <Textarea
          id="live-blog-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="What just happened..."
        />
        <Button type="button" onClick={handleAdd} disabled={pending || !body.trim()} className="mt-1 w-fit">
          Post update
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--admin-border)] px-4 py-8 text-center text-[13px] text-[var(--admin-fg-muted)]">
            No updates posted yet.
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-3 rounded-md border border-[var(--admin-border)] p-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-fg-muted)]">
                  {new Date(entry.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {entry.headline && <p className="mt-1 text-[13.5px] font-semibold text-[var(--admin-fg)]">{entry.headline}</p>}
                <div
                  className="mt-1 text-[13px] text-[var(--admin-fg-muted)] [&_p]:mb-1 last:[&_p]:mb-0"
                  dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                disabled={pending}
                aria-label="Delete update"
                className="shrink-0 rounded-md p-1.5 text-[var(--admin-fg-muted)] transition-colors hover:bg-[var(--admin-danger-bg)] hover:text-[var(--admin-danger)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
