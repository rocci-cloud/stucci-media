import Link from "next/link";
import type { Article } from "../../lib/articles";
import Badge from "./Badge";

type ArticleCardProps = {
  article: Article;
  variant?: "grid" | "list" | "ranked";
  rank?: number;
};

// Single source of truth for how an article preview renders, so the
// image treatment, hover state, and touch target stay consistent
// wherever an article link shows up: grid cards, the Hero rail, and the
// Sidebar's ranked Trending list.
export default function ArticleCard({ article, variant = "grid", rank }: ArticleCardProps) {
  if (variant === "ranked") {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className="flex px-4 py-3 sm:py-3.5 min-h-11 group active:bg-[var(--color-bg-off)] transition-colors"
      >
        <span className="flex items-center shrink-0 w-[26px] pr-3 border-r border-[var(--color-hairline)] font-headline text-[27px] font-bold tracking-[-0.01em] leading-none text-[var(--color-red)]/30">
          {rank}
        </span>
        <span className="flex items-center pl-3 font-sans text-[13.5px] font-bold leading-[1.3] tracking-[-0.005em] group-hover:text-[var(--color-red)] transition-colors">
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImageUrl}
            alt={article.headline}
            className="w-[88px] h-[60px] object-cover rounded-control shadow-sm ring-1 ring-black/5 shrink-0"
          />
        ) : (
          <div className="w-[88px] h-[60px] bg-[#E5E4E0] rounded-control shrink-0" />
        )}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="font-headline text-[15px] font-bold leading-[1.2] tracking-[-0.01em] group-hover:text-[var(--color-red)] transition-colors line-clamp-3">
            {article.headline}
          </div>
          <div className="font-sans text-[10.5px] font-bold text-[var(--color-gray-light)] mt-1.5 uppercase tracking-[0.04em]">
            {article.date}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="min-h-11 block group rounded-card overflow-hidden bg-white border border-[var(--color-hairline)] shadow-card hover:shadow-card-hover active:shadow-card-hover transition-shadow duration-200"
    >
      <div className="relative">
        {article.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImageUrl}
            alt={article.headline}
            className="aspect-[2/1] sm:aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div className="aspect-[2/1] sm:aspect-[16/9] bg-[#E5E4E0]" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/15 to-transparent" />
      </div>
      <div className="p-4 sm:p-5">
        <Badge variant="text" className="mb-2.5">
          {article.category}
        </Badge>
        <div className="font-headline text-[17px] sm:text-[18px] font-bold leading-[1.15] tracking-[-0.01em] mb-2 line-clamp-2 group-hover:text-[var(--color-red)] transition-colors">
          {article.headline}
        </div>
        <p className="text-[13.5px] text-[var(--color-gray)] leading-[1.5] line-clamp-2 mb-3.5">{article.dek}</p>
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
