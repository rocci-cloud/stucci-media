import type { Article } from "../lib/articles";
import StoryCard from "./ui/StoryCard";
import SectionLabel from "./ui/SectionLabel";

// The end-of-article rail: three compact cards, titled by section rather
// than a generic "Keep Reading", so a reader who finished a Veterans piece
// is offered more Veterans rather than more site.
export default function RelatedArticles({
  articles,
  category,
  categorySlug,
}: {
  articles: Article[];
  category?: string;
  categorySlug?: string;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-12">
      <SectionLabel
        title={category ? `More in ${category}` : "More Stories"}
        href={categorySlug ? `/category/${categorySlug}` : undefined}
      />
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3">
        {articles.slice(0, 3).map((article) => (
          <StoryCard key={article.slug} article={article} size="compact" />
        ))}
      </div>
    </section>
  );
}
