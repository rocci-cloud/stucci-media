import Image from "next/image";
import Link from "next/link";
import type { Article } from "../../lib/articles";
import { timeAgo } from "../../lib/time-ago";

export type StoryCardSize = "medium" | "compact" | "relatedText";

// The river card. One fixed stack at every size — image, kicker, headline,
// meta — so a 4-up rail and a section lead read as the same object at two
// scales rather than two designs.
//
// Deliberately flat: square corners, no shadow, no lift on hover. That is a
// departure from ArticleCard's rounded/elevated treatment, which still owns
// the article and account pages; a news river wants the photos to line up
// on a grid, and card chrome is what stops that reading as one page.
//
// Hover is image opacity and a headline colour change, nothing that moves.

const HEADLINE: Record<StoryCardSize, string> = {
  // 1.5-1.75rem
  medium: "text-[1.5rem] sm:text-[1.75rem] leading-[1.08]",
  // 1.05-1.25rem
  compact: "text-[1.05rem] sm:text-[1.25rem] leading-[1.12]",
  relatedText: "text-[1.05rem] leading-[1.15]",
};

export default function StoryCard({
  article,
  size = "compact",
  priority = false,
  className = "",
}: {
  article: Article;
  size?: StoryCardSize;
  /** Reserved for a card that is genuinely the page's LCP element. */
  priority?: boolean;
  className?: string;
}) {
  // An editorial kicker when the desk has written one, the section name
  // when it has not — never an empty slot, since the kicker is what gives
  // the stack its top edge.
  const kicker = article.kicker?.trim() || article.category;
  const posted = timeAgo(article.publishedAt);

  if (size === "relatedText") {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className={`group block min-h-11 border-t border-[var(--color-hairline)] py-2.5 ${className}`}
      >
        <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-red-ink)]">
          {kicker}
        </div>
        <h3
          className={`mt-1 font-headline font-bold tracking-[-0.01em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-3 ${HEADLINE.relatedText}`}
        >
          {article.headline}
        </h3>
        {posted && (
          <div className="mt-1.5 font-sans text-[12px] text-[var(--color-gray-light)]">{posted}</div>
        )}
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug}`} className={`group block min-h-11 ${className}`}>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2px] bg-[var(--color-bg-off)]">
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt={article.headline}
            fill
            priority={priority}
            sizes={size === "medium" ? "(max-width: 768px) 100vw, 720px" : "(max-width: 768px) 50vw, 360px"}
            className="img-cinematic object-cover transition-opacity duration-200 group-hover:opacity-[0.92]"
          />
        ) : (
          <div className="img-placeholder absolute inset-0" />
        )}
      </div>

      {/* 8px */}
      <div className="mt-2 font-sans text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-red-ink)]">
        {kicker}
      </div>

      {/* 4px */}
      <h3
        className={`mt-1 font-headline font-bold tracking-[-0.015em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-3 ${HEADLINE[size]}`}
      >
        {article.headline}
      </h3>

      {/* 6px — category, age, read time. No excerpt, no byline. */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 font-sans text-[12px] text-[var(--color-gray-light)]">
        <span>{article.category}</span>
        {posted && (
          <>
            <span aria-hidden>·</span>
            <span>{posted}</span>
          </>
        )}
        {article.readTime && (
          <>
            <span aria-hidden>·</span>
            <span>{article.readTime}</span>
          </>
        )}
      </div>
    </Link>
  );
}
