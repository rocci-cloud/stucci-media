import type { Article } from "../lib/articles";
import type { Category } from "../lib/categories";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

// Podcasts is the site's only audio-episode content — browsed like a
// shelf, not read top-to-bottom — so this module scrolls horizontally
// (the same snap-scroll technique as the hero's secondary rail) instead
// of stacking vertically like every other homepage module. Structurally
// the most distinct desk on the page: fixed-width tiles, no hierarchy,
// pure browse.
export default function PodcastShelf({
  category,
  articles,
}: {
  category: Category;
  articles: Article[];
}) {
  if (articles.length === 0) return null;
  const items = articles.slice(0, 6);

  return (
    <section className="py-3 sm:py-5 px-4 sm:px-6 border-t border-[var(--color-hairline)] first:border-t-0">
      <SectionHeader title={category.label} href={`/category/${category.slug}`} compact />
      <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-1 scrollbar-none">
        {items.map((a) => (
          <div key={a.slug} className="w-[200px] sm:w-[240px] shrink-0 snap-start">
            <ArticleCard article={a} variant="grid" />
          </div>
        ))}
      </div>
    </section>
  );
}
