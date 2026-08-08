import type { Article } from "../lib/articles";
import ArticleCard from "./ui/ArticleCard";

// The top of every category page gets an intentional lead + briefs
// treatment — one dominant story plus a tight stack of the next three —
// instead of the most recent article just being first-in-line inside a
// flat grid. Same asymmetric pattern TopicRail established on the
// homepage, reused verbatim here rather than inventing a second one.
export default function CategoryLead({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const briefs = rest.slice(0, 3);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-4 sm:gap-6">
      <ArticleCard article={lead} variant="grid" />
      {briefs.length > 0 && (
        <div className="flex flex-col divide-y divide-[var(--color-hairline)] rounded-card border border-[var(--color-hairline)] bg-white shadow-card overflow-hidden">
          {briefs.map((a) => (
            <ArticleCard key={a.slug} article={a} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}
