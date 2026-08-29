import Link from "next/link";
import type { Article } from "../lib/articles";
import type { Category } from "../lib/categories";
import CategoryCard from "./ui/CategoryCard";
import { ARTICLE_GRID } from "../lib/article-grid";
import { CardEnter, stickySectionLabel } from "./motion";

// A homepage category band: label, thin crimson rule, then an even grid.
//
// Replaces the lead-plus-three split this band used to run. Six equal cards
// fill two clean rows at three columns, where the asymmetric version left a
// tall lead beside a short stack and a ragged bottom edge.
//
// Columns come from ARTICLE_GRID so every article grid on the homepage
// shares one rule — see the note there on why the breakpoints are explicit
// pixel values rather than Tailwind's sm/lg.
export default function CategoryGrid({
  category,
  articles,
  commentCounts,
  relatedBySlug,
}: {
  category: Category;
  articles: Article[];
  commentCounts?: Map<number, number>;
  /** Real same-section follow-ups, keyed by the card's slug. */
  relatedBySlug?: Map<string, Article[]>;
}) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby={`band-${category.slug}`} className="shell pt-6 sm:pt-7">
      <div className={`${stickySectionLabel} mb-3 flex items-baseline justify-between gap-4 border-b border-[var(--color-red)] pt-1.5 pb-1.5`}>
        <h2
          id={`band-${category.slug}`}
          className="font-headline text-[14px] sm:text-[16px] font-bold uppercase leading-none tracking-[0.1em] text-[var(--color-text)]"
        >
          {category.label}
        </h2>
        <Link
          href={`/category/${category.slug}`}
          className="inline-flex min-h-11 items-center font-sans text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-red-ink)] transition-colors hover:text-[var(--color-red-dark)]"
        >
          View all →
        </Link>
      </div>

      <CardEnter>
        <div className={ARTICLE_GRID}>
          {articles.map((article) => (
            <CategoryCard
              key={article.slug}
              article={article}
              commentCount={commentCounts?.get(article.id)}
              related={relatedBySlug?.get(article.slug)}
            />
          ))}
        </div>
      </CardEnter>
    </section>
  );
}
