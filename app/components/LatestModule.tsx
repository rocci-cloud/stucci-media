import type { Article } from "../lib/articles";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

// The homepage's top-of-stream "wire" desk: recency over hierarchy, a
// dense grid of equal-weight variant="list" items (small thumbnail,
// tight headline, date) with no dominant lead image — the deliberate
// opposite of TopicRail's lead+briefs modules below it, so "what's
// newest" reads structurally distinct from "what matters most in this
// category." The `gap-px` + hairline background is a table-like grid
// technique: each cell is white, the 1px gap shows through as a hairline
// divider on every side without hand-computing per-cell border classes.
export default function LatestModule({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  const items = articles.slice(0, 6);

  return (
    <section className="py-3 sm:py-5 px-4 sm:px-6">
      <SectionHeader title="Latest" compact />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-hairline)] rounded-card border border-[var(--color-hairline)] shadow-card overflow-hidden">
        {items.map((a) => (
          <div key={a.slug} className="bg-white">
            <ArticleCard article={a} variant="list" />
          </div>
        ))}
      </div>
    </section>
  );
}
