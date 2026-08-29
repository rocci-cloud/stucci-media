import type { Article } from "../lib/articles";
import CategoryCard from "./ui/CategoryCard";
import SectionLabel from "./ui/SectionLabel";
import { ARTICLE_GRID } from "../lib/article-grid";

// "Recommended For You", driven by a reader's own reading history (see
// getTopCategorySlugs in lib/interests.ts). Only ever rendered for a
// signed-in reader with real history — a new or signed-out visitor sees
// nothing rather than a generic rail pretending to be personalized.
export default function PersonalizedRail({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="shell pt-5 sm:pt-6">
      <SectionLabel title="Recommended For You" />
      <div className={ARTICLE_GRID}>
        {articles.slice(0, 3).map((article) => (
          <CategoryCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
