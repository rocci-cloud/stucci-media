import type { Article } from "../lib/articles";
import PosterCard from "./ui/PosterCard";

// "Also making headlines" — the block directly under the hero.
//
// Deliberately not three equal cards. One story takes ~60% of the width and
// two stack beside it in the remaining ~40%, then a flat four-up rail runs
// underneath. The asymmetry is the point: three equal tiles tell a reader
// the three stories are equally important, which is a claim a newsroom
// almost never actually wants to make.
//
// On mobile it collapses to exactly what the brief asks for — one large
// poster, then the rest as a compact list — rather than a scaled-down
// version of the desktop grid.
export default function HeadlineMosaic({
  articles,
  title = "Also Making Headlines",
  id = "mosaic",
}: {
  articles: Article[];
  /** The block is used twice on the homepage — under the hero, and again
      for the overflow that the shaped blocks did not consume. */
  title?: string;
  id?: string;
}) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const stacked = rest.slice(0, 2);
  const rail = rest.slice(2, 6);

  return (
    <section aria-labelledby={`${id}-heading`} className="shell pt-2 sm:pt-3">
      <div className="mb-2 flex items-center gap-2.5 border-b-2 border-[var(--color-hairline-strong)] pb-1.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-red)] [animation:livePip_2.4s_ease-in-out_infinite]" />
        </span>
        <h2
          id={`${id}-heading`}
          className="font-headline text-[15px] sm:text-[17px] font-bold uppercase leading-none tracking-[0.08em] text-[var(--color-text)]"
        >
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[3fr_2fr]">
        <PosterCard article={lead} size="lead" showDek />
        {stacked.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {stacked.map((article) => (
              <PosterCard key={article.slug} article={article} size="stack" />
            ))}
          </div>
        )}
      </div>

      {rail.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {rail.map((article) => (
            <PosterCard key={article.slug} article={article} size="rail" />
          ))}
        </div>
      )}
    </section>
  );
}
