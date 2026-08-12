import type { DigestArticle } from "../../lib/digest";

// A self-contained, table-based-layout-free approximation of what the
// weekly digest email would look like — close enough to the real HTML
// email structure (single column, fixed-ish width, inline-styled) to
// judge content/hierarchy without actually being an email client's DOM.
export default function DigestPreview({
  recipientLabel,
  articles,
}: {
  recipientLabel: string;
  articles: DigestArticle[];
}) {
  return (
    <div className="mx-auto max-w-[560px] overflow-hidden rounded-md border border-[var(--admin-border)] bg-white">
      <div className="bg-[var(--color-navy)] px-6 py-5 text-center">
        <div className="font-headline text-[20px] font-bold uppercase tracking-[-0.015em] text-white">
          Stucci<span className="text-[var(--color-red)]">Media</span>
        </div>
        <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-white/60">Your Weekly Brief</p>
      </div>

      <div className="px-6 py-4 border-b border-[var(--admin-border)] text-[12px] text-[var(--admin-fg-muted)]">
        To: {recipientLabel}
      </div>

      {articles.length === 0 ? (
        <p className="px-6 py-10 text-center text-[13px] text-[var(--admin-fg-muted)]">
          Not enough published this week to build a digest yet.
        </p>
      ) : (
        <div className="divide-y divide-[var(--admin-border)]">
          {articles.map((article, i) => (
            <div key={article.id} className="flex gap-4 px-6 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-off)] font-headline text-[15px] font-bold text-[var(--color-navy)]">
                {i + 1}
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--color-red)]">
                  {article.category}
                </span>
                <h3 className="mt-0.5 font-headline text-[16px] font-bold uppercase leading-[1.2] tracking-[-0.005em] text-[var(--color-text)]">
                  {article.headline}
                </h3>
                <p className="mt-1 text-[13px] leading-[1.5] text-[var(--admin-fg-muted)]">{article.dek}</p>
                <p className="mt-1.5 text-[11px] text-[var(--admin-fg-muted)]">
                  {article.author} · {article.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[var(--color-bg-off)] px-6 py-4 text-center text-[11px] text-[var(--admin-fg-muted)]">
        Stucci Media · Florida · stuccimedia.com
      </div>
    </div>
  );
}
