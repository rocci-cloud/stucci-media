import Link from "next/link";
import type { Article } from "../lib/articles";
import type { Category } from "../lib/categories";
import PosterCard from "./ui/PosterCard";

// One band per section: a dominant story and three compact ones beside it.
//
// The section label is sticky within its own band, so while a reader is
// scrolling through Crime & Investigation the words "Crime & Investigation"
// stay pinned at the top of that band and release when the next one takes
// over — the same job a broadcast lower-third does, telling you which desk
// you are watching without repeating itself in every tile.
export default function CategoryBand({
  category,
  articles,
}: {
  category: Category;
  articles: Article[];
}) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const compact = rest.slice(0, 3);
  const isVeterans = category.slug === "veterans";

  return (
    <section aria-labelledby={`band-${category.slug}`} className="shell pt-3.5 sm:pt-5">
      <div className="sticky top-[44px] z-20 -mx-[var(--gutter)] mb-2 bg-[var(--color-bg)]/95 px-[var(--gutter)] py-1.5 backdrop-blur-sm">
        <div
          className={`flex items-baseline justify-between gap-4 border-b-2 pb-2 ${
            isVeterans ? "border-[var(--color-gold)]" : "border-[var(--color-red)]"
          }`}
        >
          <h2
            id={`band-${category.slug}`}
            className="font-headline text-[20px] sm:text-[26px] font-bold uppercase leading-none tracking-[-0.01em] text-[var(--color-text)]"
          >
            {category.label}
          </h2>
          <Link
            href={`/category/${category.slug}`}
            className="inline-flex min-h-11 items-center font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-red-ink)] transition-colors hover:text-[var(--color-red-dark)]"
          >
            All {category.label} →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[3fr_2fr]">
        <PosterCard article={lead} size="lead" showDek />
        {compact.length > 0 && (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {compact.map((article) => (
              <PosterCard key={article.slug} article={article} size="compact" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
