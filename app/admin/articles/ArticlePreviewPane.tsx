"use client";

/**
 * Side-by-side live preview. Renders the same `prose` treatment the public
 * article page uses so what a writer sees here matches what ships — it
 * deliberately reuses the article template's classes rather than
 * approximating them with editor styling.
 */
export default function ArticlePreviewPane({
  headline,
  dek,
  author,
  coverImageUrl,
  bodyHtml,
  bulletPoints,
  category,
}: {
  headline: string;
  dek: string;
  author: string;
  coverImageUrl: string | null;
  bodyHtml: string;
  bulletPoints: string[];
  category: string;
}) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="h-full overflow-y-auto rounded-md border border-[var(--admin-border)] bg-white">
      <div className="sticky top-0 z-10 border-b border-[var(--admin-border)] bg-[var(--admin-bg-subtle)]/90 px-3 py-1.5 backdrop-blur">
        <span className="text-[10.5px] font-semibold tracking-[0.06em] text-[var(--admin-fg-muted)] uppercase">
          Live preview
        </span>
      </div>

      <article className="px-5 py-5">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="" className="mb-4 aspect-video w-full rounded object-cover" />
        ) : (
          <div className="mb-4 aspect-video w-full rounded bg-[#ece9e4]" />
        )}

        <p className="text-[10.5px] font-bold tracking-[0.05em] text-[#c8102e] uppercase">{category}</p>
        <h1 className="mt-1.5 font-headline text-[28px] leading-[0.98] font-bold tracking-[-0.015em] text-[#14181f] uppercase">
          {headline || "Untitled story"}
        </h1>
        {dek && <p className="mt-2 text-[15px] leading-[1.5] text-[#55606c]">{dek}</p>}

        <p className="mt-3 text-[11px] tracking-[0.04em] text-[#6b7684] uppercase">
          By {author || "Rocci Stucci"} · {today}
        </p>

        {bulletPoints.length > 0 && (
          <div className="mt-5 border-l-4 border-[#c8102e] bg-[#f7f8fa] px-4 py-3">
            <p className="text-[10.5px] font-bold tracking-[0.05em] text-[#c8102e] uppercase">The bottom line</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[14px] text-[#14181f]">
              {bulletPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {bodyHtml ? (
          <div
            className="prose prose-sm mt-5 max-w-none prose-headings:font-headline prose-a:text-[#c8102e]"
            // Preview only — this is the writer's own in-progress markup,
            // shown back to them before it is ever sanitized and stored.
            // The stored/published copy always goes through
            // sanitizeArticleHtml on save.
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : (
          <p className="mt-5 text-[14px] text-[#8a94a0] italic">The story will appear here as you write it.</p>
        )}
      </article>
    </div>
  );
}
