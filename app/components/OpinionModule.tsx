import type { Article } from "../lib/articles";
import type { Category } from "../lib/categories";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

// Opinion & Analysis is argument-driven, not photo-driven — this module
// drops imagery entirely (ArticleCard's imageless "ranked" variant) and
// runs a dense two-column wall of headlines instead of TopicRail's
// image-led lead+briefs pattern, so the desk reads structurally as "a
// column section," not another photo grid repeated with different text.
export default function OpinionModule({
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[var(--color-hairline)] rounded-card border border-[var(--color-hairline)] shadow-card overflow-hidden">
        {items.map((a, i) => (
          <div key={a.slug} className="bg-white">
            <ArticleCard article={a} variant="ranked" rank={i + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
