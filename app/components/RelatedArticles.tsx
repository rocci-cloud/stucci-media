import type { Article } from "../lib/articles";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

export default function RelatedArticles({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-[var(--color-hairline)]">
      <SectionHeader title="You May Also Like" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} variant="grid" />
        ))}
      </div>
    </section>
  );
}
