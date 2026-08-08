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
        className="flex gap-3 px-4 py-3 sm:py-3.5 min-h-11 group active:bg-[var(--color-bg-off)] transition-colors"
      >
        <span className="font-headline text-[27px] font-bold tracking-[-0.01em] text-[var(--color-red)]/25 leading-none shrink-0 w-[26px]">
          {rank}
        </span>
        <span className="font-sans text-[13.5px] font-bold leading-[1.3] tracking-[-0.005em] group-hover:text-[var(--color-red)] transition-colors">
          {article.headline}
        </span>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className="flex gap-3 sm:gap-3.5 px-4 py-3 sm:py-3.5 min-h-11 group active:bg-[var(--color-bg-off)] transition-colors"
      >
        {article.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImageUrl}
            alt={article.headline}
            className="w-[84px] h-[64px] object-cover rounded-control shadow-sm shrink-0"
          />
        ) : (
          <div className="w-[84px] h-[64px] bg-[#E5E4E0] rounded-control shrink-0" />
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
      <div className="p-3.5 sm:p-4">
        <Badge variant="text" className="mb-2">
          {article.category}
        </Badge>
        <div className="font-headline text-[17px] sm:text-[18px] font-bold leading-[1.15] tracking-[-0.01em] mb-1.5 line-clamp-2 group-hover:text-[var(--color-red)] transition-colors">
          {article.headline}
        </div>
        <p className="text-[13.5px] text-[var(--color-gray)] leading-[1.5] line-clamp-2 mb-3">{article.dek}</p>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-sans text-[11px] tracking-[0.01em] text-[var(--color-gray-light)] pt-3 border-t border-[var(--color-hairline)]">
          <span className="font-bold text-[var(--color-text)]">{article.author}</span>
          <span>·</span>
          <span>{article.date}</span>
          <span>·</span>
          <span>{article.readTime}</span>
        </div>
      </div>
    </Link>
  );
}
