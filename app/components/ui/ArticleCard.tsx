import Image from "next/image";
import Link from "next/link";
import type { Article } from "../../lib/articles";
import Badge from "./Badge";

type ArticleCardProps = {
  article: Article;
  variant?: "grid" | "wide" | "list" | "ranked";
  rank?: number;
};

// Single source of truth for how an article preview renders, so the
// image treatment, hover state, and touch target stay consistent
// wherever an article link shows up: grid cards, the Hero rail, and the
// Sidebar's ranked Trending list.
//
// `wide` is the same card turned on its side — image left, copy right —
// for the one-story case. A `grid` card stretched to a full column turns
// its 16:9 image into a ~460px-tall slab, so a single story would take up
// more vertical space than a full four-story module; laying it out
// horizontally fills the width without that.
export default function ArticleCard({ article, variant = "grid", rank }: ArticleCardProps) {
  if (variant === "ranked") {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className="flex px-4 py-3 sm:py-3.5 min-h-11 group active:bg-[var(--color-bg-off)] transition-colors"
      >
        <span className="flex items-center shrink-0 w-[26px] pr-3 border-r border-[var(--color-hairline)] font-headline text-[27px] font-bold tracking-[-0.01em] leading-none text-[var(--color-red-ink)]/30 transition-colors group-hover:text-[var(--color-red-ink)]/60">
          {rank}
        </span>
        <span className="flex items-center pl-3 font-sans text-[13.5px] font-bold leading-[1.3] tracking-[-0.005em] group-hover:text-[var(--color-red-ink)] transition-colors">
          {article.headline}
        </span>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className="flex gap-3.5 sm:gap-4 px-4 py-3 sm:py-3.5 min-h-11 group active:bg-[var(--color-bg-off)] transition-colors"
      >
        {article.coverImageUrl ? (
          <div className="relative w-[88px] h-[60px] shrink-0 overflow-hidden rounded-control shadow-sm ring-1 ring-black/5">
            <Image
              src={article.coverImageUrl}
              alt={article.headline}
              fill
              sizes="88px"
              className="img-cinematic object-cover transition-transform duration-[600ms] group-hover:scale-[1.08]"
            />
          </div>
        ) : (
          <div className="img-placeholder w-[88px] h-[60px] rounded-control shrink-0" />
        )}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="font-headline text-[15px] font-bold leading-[1.2] tracking-[-0.01em] group-hover:text-[var(--color-red-ink)] transition-colors line-clamp-3">
            {article.headline}
          </div>
          <div className="font-sans text-[10.5px] font-bold text-[var(--color-gray-light)] mt-1.5 uppercase tracking-[0.04em]">
            {article.date}
          </div>
        </div>
      </Link>
    );
  }

  const wide = variant === "wide";

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={`min-h-11 group rounded-card overflow-hidden bg-[var(--color-surface)] border border-[var(--color-hairline)] shadow-card hover:shadow-card-hover active:shadow-card-hover transition hover:-translate-y-[3px] active:translate-y-0 active:scale-[0.99] ${
        wide ? "grid grid-cols-1 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" : "block"
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          wide ? "aspect-[2/1] sm:aspect-auto sm:h-full sm:min-h-[220px]" : "aspect-[2/1] sm:aspect-[16/9]"
        }`}
      >
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt={article.headline}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="img-cinematic object-cover transition-transform duration-[600ms] group-hover:scale-[1.05]"
          />
        ) : (
          <div className="img-placeholder absolute inset-0" />
        )}
        {article.isExclusive && (
          <Badge variant="onDark" className="absolute left-3 top-3">
            Exclusive
          </Badge>
        )}
        {article.isLiveBlog && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-red)] px-2 py-[3px] font-sans text-[10px] font-bold uppercase tracking-[0.05em] text-white">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            Live
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/18 to-transparent" />
      </div>
      <div className={wide ? "p-4 sm:p-6 flex flex-col justify-center" : "p-4 sm:p-5"}>
        <Badge variant="text" className="mb-2.5">
          {article.category}
        </Badge>
        <div
          className={`font-headline font-bold leading-[1.15] tracking-[-0.01em] mb-2 line-clamp-2 group-hover:text-[var(--color-red-ink)] transition-colors ${
            wide ? "text-[19px] sm:text-[24px]" : "text-[17px] sm:text-[18px]"
          }`}
        >
          {article.headline}
        </div>
        <p
          className={`text-[var(--color-gray)] leading-[1.5] mb-3.5 ${
            wide ? "text-[14px] sm:text-[15px] line-clamp-3" : "text-[13.5px] line-clamp-2"
          }`}
        >
          {article.dek}
        </p>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-sans text-[11px] uppercase tracking-[0.04em] text-[var(--color-gray-light)] pt-3.5 border-t border-[var(--color-hairline)]">
          <span className="font-bold text-[var(--color-text)]">{article.author}</span>
          <span className="text-[var(--color-hairline-strong)]/30">·</span>
          <span>{article.date}</span>
          <span className="text-[var(--color-hairline-strong)]/30">·</span>
          <span>{article.readTime}</span>
        </div>
      </div>
    </Link>
  );
}
