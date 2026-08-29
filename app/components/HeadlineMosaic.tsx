import type { Article } from "../lib/articles";
import StoryCard from "./ui/StoryCard";
import SectionLabel from "./ui/SectionLabel";

// A block of the river: one medium card carrying the section, then a
// compact 4-up rail underneath.
//
// Not a mosaic of overlaid posters any more — the cards are the flat
// image/kicker/headline/meta stack, so a reader scanning down the page
// gets the same shape at two sizes instead of two different treatments.
export default function HeadlineMosaic({
  articles,
  title = "Also Making Headlines",
  href,
}: {
  articles: Article[];
  title?: string;
  href?: string;
}) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const rail = rest.slice(0, 4);

  return (
    <section className="shell pt-4 sm:pt-5">
      <SectionLabel title={title} href={href} />
      <StoryCard article={lead} size="medium" className="mb-4" />
      {rail.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
          {rail.map((a) => (
            <StoryCard key={a.slug} article={a} size="compact" />
          ))}
        </div>
      )}
    </section>
  );
}
