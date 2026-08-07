import type { Article } from "../lib/articles";
import type { Category } from "../lib/categories";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

export default function TopicRail({
  category,
  articles,
}: {
  category: Category;
  articles: Article[];
}) {
  if (articles.length === 0) return null;

  return (
    <section className="py-6 border-t border-[var(--color-hairline)] first:border-t-0 first:pt-0">
      <SectionHeader title={category.label} href={`/category/${category.slug}`} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} variant="grid" />
        ))}
      </div>
    </section>
  );
}
