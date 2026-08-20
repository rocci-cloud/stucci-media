import type { Article } from "../lib/articles";
import type { Category } from "../lib/categories";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

// One module per category on the homepage. Deliberately asymmetric instead
// of N equal-weight cards: a single lead story (variant="grid", full visual
// treatment) carries the section's weight, and the remaining stories run
// tight in a bordered variant="list" stack beside it — same pattern as a
// real news page's "top story + briefs" module, not a uniform blog grid.
export default function TopicRail({
  category,
  articles,
  alternate = false,
}: {
  category: Category;
  articles: Article[];
  alternate?: boolean;
}) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const secondary = rest.slice(0, 3);

  const wrapper = `py-3 sm:py-5 px-4 sm:px-6 border-t border-[var(--color-hairline)] first:border-t-0 ${
    alternate ? "bg-[var(--color-bg-off)] rounded-card border-t-0" : ""
  }`;
  const header = (
    <SectionHeader title={category.label} href={`/category/${category.slug}`} compact />
  );

  // A lightly-covered category has nothing to put in the briefs column, and
  // the asymmetric split then renders a tall band that is mostly empty white
  // space beside one card. Below three stories the module drops the split and
  // lays the stories out as equal cards across the full width instead.
  if (articles.length < 3) {
    return (
      <section className={wrapper}>
        {header}
        <div
          className={`grid gap-3 sm:gap-5 ${
            articles.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} variant={articles.length === 1 ? "wide" : "grid"} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={wrapper}>
      {header}
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-3 sm:gap-5">
        <ArticleCard article={lead} variant="grid" />
        <div className="flex flex-col divide-y divide-[var(--color-hairline)] rounded-card border border-[var(--color-hairline)] bg-white shadow-card overflow-hidden">
          {secondary.map((a) => (
            <ArticleCard key={a.slug} article={a} variant="list" />
          ))}
        </div>
      </div>
    </section>
  );
}
