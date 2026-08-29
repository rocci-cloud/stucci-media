import type { Article } from "../lib/articles";
import type { Category } from "../lib/categories";
import StoryCard from "./ui/StoryCard";
import SectionLabel from "./ui/SectionLabel";

// One band per section: a medium card, then compact cards across.
export default function CategoryBand({
  category,
  articles,
}: {
  category: Category;
  articles: Article[];
}) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const compact = rest.slice(0, 3);

  return (
    <section className="shell pt-5 sm:pt-6">
      <SectionLabel title={category.label} href={`/category/${category.slug}`} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[58fr_42fr] lg:gap-6">
        <StoryCard article={lead} size="medium" />
        {compact.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-1 lg:gap-y-4">
            {compact.map((a) => (
              <StoryCard key={a.slug} article={a} size="compact" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
