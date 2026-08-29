import type { Article } from "../lib/articles";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

// The homepage's "Recommended For You" module — same lead+briefs visual
// language as TopicRail, but driven by a reader's own reading history
// (see getTopCategorySlugs in lib/interests.ts) instead of one fixed
// category. Only ever rendered for a signed-in reader with real reading
// history; a brand-new reader or a signed-out visitor never sees this
// module at all rather than a generic "latest" rail pretending to be
// personalized.
export default function PersonalizedRail({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const secondary = rest.slice(0, 3);

  return (
    <section className="py-3 sm:py-5 px-4 sm:px-6 rounded-card bg-[var(--color-bg-off)] border border-[var(--color-hairline)]">
      <SectionHeader title="Recommended For You" compact />
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-3 sm:gap-5">
        <ArticleCard article={lead} variant="grid" />
        {secondary.length > 0 && (
          <div className="flex flex-col divide-y divide-[var(--color-hairline)] rounded-card border border-[var(--color-hairline)] bg-[var(--color-surface)] shadow-card overflow-hidden">
            {secondary.map((a) => (
              <ArticleCard key={a.slug} article={a} variant="list" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
