import type { LiveBlogEntry } from "../../lib/live-blog";

function formatEntryTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

// Reverse-chronological timeline for a live-blog-format article (see
// Article.isLiveBlog) — newest update first, matching every real news
// site's live-blog convention. Renders nothing (not an empty-state
// message) when there are no entries yet, since a live blog that hasn't
// posted its first update is indistinguishable from "not live blog
// content" to a reader — the LIVE badge in the hero already signals
// intent, this component only needs to show real updates.
export default function LiveBlogTimeline({ entries }: { entries: LiveBlogEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="mb-8 rounded-card border border-[var(--color-hairline)] shadow-card overflow-hidden">
      <div className="flex items-center gap-2 bg-[var(--color-navy)] px-5 py-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-red)] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-red)]" />
        </span>
        <span className="font-sans text-[12px] font-bold uppercase tracking-[0.08em] text-white">
          Live Updates
        </span>
        <span className="font-sans text-[11px] text-white/50">
          {entries.length} update{entries.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="divide-y divide-[var(--color-hairline)]">
        {entries.map((entry) => (
          <div key={entry.id} className="px-5 py-4">
            <p className="mb-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-red-ink)]">
              {formatEntryTime(entry.createdAt)}
            </p>
            {entry.headline && (
              <h3 className="mb-1.5 font-headline text-[16px] font-bold uppercase leading-[1.15] tracking-[-0.005em] text-[var(--color-text)]">
                {entry.headline}
              </h3>
            )}
            <div
              className="font-sans text-[14.5px] leading-[1.55] text-[var(--color-text)] [&_p]:mb-2 last:[&_p]:mb-0"
              dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
