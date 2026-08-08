import type { Article } from "../lib/articles";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

// Sits at the bottom of every article, right where a reader has just
// finished and is deciding whether to leave — a plain heading + grid
// blended into the page's white background read as an afterthought. A
// tinted panel (the same bg-off surface treatment used for the
// homepage's differentiated desks) gives it its own visual weight, so
// it reads as "here's what to read next," not a trailing widget.
export default function RelatedArticles({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-14 px-5 py-8 sm:py-10 rounded-card bg-[var(--color-bg-off)]">
      <SectionHeader title="Keep Reading" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} variant="grid" />
        ))}
      </div>
    </section>
  );
}
