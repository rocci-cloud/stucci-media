import type { Article } from "../lib/articles";
import PosterCard from "./ui/PosterCard";

// The homepage's "Recommended For You" module, driven by a reader's own
// reading history (see getTopCategorySlugs in lib/interests.ts) rather than
// one fixed category. Only ever rendered for a signed-in reader with real
// history; a brand-new reader or a signed-out visitor never sees it at all
// rather than a generic "latest" rail pretending to be personalized.
//
// Moved from ArticleCard to PosterCard in the density pass: it was the last
// homepage row still built from white cards, which meant a 2:1 mobile crop
// and a panel inset while every band around it ran full-bleed posters at
// 16:9 / 3:2. ArticleCard itself is untouched — it still owns the category,
// article, tag and author pages.
export default function PersonalizedRail({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const compact = rest.slice(0, 3);

  return (
    <section aria-labelledby="recommended-heading">
      <div className="mb-2 flex items-center gap-2.5 border-b-2 border-[var(--color-hairline-strong)] pb-1.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
        <h2
          id="recommended-heading"
          className="font-headline text-[15px] sm:text-[17px] font-bold uppercase leading-none tracking-[0.08em] text-[var(--color-text)]"
        >
          Recommended For You
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[3fr_2fr]">
        <PosterCard article={lead} size="lead" showDek />
        {compact.length > 0 && (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {compact.map((a) => (
              <PosterCard key={a.slug} article={a} size="compact" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
