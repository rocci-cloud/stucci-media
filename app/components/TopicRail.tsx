import type { Article } from "../lib/articles";
import type { Category } from "../lib/categories";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

export default function TopicRail({
  category,
  articles,
  alternate = false,
}: {
  category: Category;
  articles: Article[];
  alternate?: boolean;
}) {
  if (articles.length === 0) return null;

  return (
    <section
      className={`py-6 sm:py-7 px-4 sm:px-6 ${alternate ? "bg-[var(--color-bg-off)] rounded-card" : ""}`}
    >
      <SectionHeader title={category.label} href={`/category/${category.slug}`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} variant="grid" />
        ))}
      </div>
    </section>
  );
}
