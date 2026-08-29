import type { Article } from "../lib/articles";
import StoryCard from "./ui/StoryCard";
import SectionLabel from "./ui/SectionLabel";

// The river below a listing page's lead: a 3-up grid of compact cards,
// then whatever is left as a text-only list.
//
// The split point is deliberate. A photo grid that runs for forty stories
// stops being scannable — the images all blur together and the page turns
// into an infinite wall. The first twelve get pictures; the tail runs as
// headlines, which is how a real section front handles depth.
const GRID_LIMIT = 12;

export default function ArticleGrid({
  articles,
  title = "More Stories",
}: {
  articles: Article[];
  title?: string;
}) {
  if (articles.length === 0) {
    return (
      <div>
        <SectionLabel title={title} />
        <p className="font-sans text-[var(--color-gray)] text-sm py-6">
          No more stories in this category yet — check back soon.
        </p>
      </div>
    );
  }

  const grid = articles.slice(0, GRID_LIMIT);
  const tail = articles.slice(GRID_LIMIT);

  return (
    <div>
      <SectionLabel title={title} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3">
        {grid.map((a) => (
          <StoryCard key={a.slug} article={a} size="compact" />
        ))}
      </div>
      {tail.length > 0 && (
        <div className="mt-7">
          {tail.map((a) => (
            <StoryCard key={a.slug} article={a} size="relatedText" />
          ))}
        </div>
      )}
    </div>
  );
}
