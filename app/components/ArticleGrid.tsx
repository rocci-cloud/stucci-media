import type { Article } from "../lib/articles";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

export default function ArticleGrid({
  articles,
  title = "Latest Stories",
}: {
  articles: Article[];
  title?: string;
}) {
  return (
    <div>
      <SectionHeader title={title} />
      {articles.length === 0 ? (
        <p className="font-sans text-[var(--color-gray)] text-sm py-6">
          No stories in this category yet — check back soon.
        </p>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} variant="grid" />
          ))}
        </section>
      )}
    </div>
  );
}
