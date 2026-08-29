import Link from "next/link";
import type { Article } from "../lib/articles";
import type { Category } from "../lib/categories";
import CategoryCard from "./ui/CategoryCard";

// A homepage category band: label, thin crimson rule, then an even grid.
//
// Replaces the lead-plus-three split this band used to run. Six equal cards
// fill two clean rows at three columns, where the asymmetric version left a
// tall lead beside a short stack and a ragged bottom edge.
//
// Three columns start at 1100px rather than Tailwind's 1024px `lg`: at 1024
// a third column squeezes each card under ~320px, which is where the
// three-line headline clamp starts wrapping badly.
export default function CategoryGrid({
  category,
  articles,
  commentCounts,
}: {
  category: Category;
  articles: Article[];
  commentCounts?: Map<number, number>;
}) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby={`band-${category.slug}`} className="shell pt-6 sm:pt-7">
      <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-[var(--color-red)] pb-1.5">
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

      <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 min-[1100px]:grid-cols-3">
        {articles.map((article) => (
          <CategoryCard
            key={article.slug}
            article={article}
            commentCount={commentCounts?.get(article.id)}
          />
        ))}
      </div>
    </section>
  );
}
