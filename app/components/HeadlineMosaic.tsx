import type { Article } from "../lib/articles";
import CategoryCard from "./ui/CategoryCard";
import SectionLabel from "./ui/SectionLabel";
import { ARTICLE_GRID } from "../lib/article-grid";

// A block of the homepage river: label, then an even three-across grid.
//
// Was a 60/40 medium lead beside a four-up rail. Two arrangements in one
// module meant the row under the hero never lined up with the category
// bands below it; every article grid on the page is the same three-column
// shape now.
export default function HeadlineMosaic({
  articles,
  title = "Also Making Headlines",
  href,
  relatedBySlug,
}: {
  articles: Article[];
  title?: string;
  href?: string;
  /** Real same-section follow-ups, keyed by the card's slug. */
  relatedBySlug?: Map<string, Article[]>;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="shell pt-4 sm:pt-5">
      <SectionLabel title={title} href={href} />
      <div className={ARTICLE_GRID}>
        {articles.map((article) => (
          <CategoryCard
            key={article.slug}
            article={article}
            related={relatedBySlug?.get(article.slug)}
          />
        ))}
      </div>
    </section>
  );
}
