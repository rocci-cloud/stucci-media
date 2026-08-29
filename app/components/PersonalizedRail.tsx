import type { Article } from "../lib/articles";
import StoryCard from "./ui/StoryCard";
import SectionLabel from "./ui/SectionLabel";

// "Recommended For You", driven by a reader's own reading history (see
// getTopCategorySlugs in lib/interests.ts). Only ever rendered for a
// signed-in reader with real history — a new or signed-out visitor sees
// nothing rather than a generic rail pretending to be personalized.
export default function PersonalizedRail({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const compact = rest.slice(0, 3);

  return (
    <section className="shell pt-5 sm:pt-6">
      <SectionLabel title="Recommended For You" />
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
