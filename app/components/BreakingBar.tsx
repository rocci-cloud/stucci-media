import { getPublishedArticles } from "../lib/articles";
import BreakingTicker from "./BreakingTicker";
import Badge from "./ui/Badge";

export default async function BreakingBar() {
  const articles = await getPublishedArticles();
  const items = articles.slice(0, 4).map((a) => ({ slug: a.slug, headline: a.headline }));

  if (items.length === 0) return null;

  return (
    <div className="bg-[var(--color-red)]">
      <div className="mx-auto max-w-[1280px] px-5 py-2 flex items-center gap-2.5 text-[13px] font-sans font-medium tracking-[0.005em] min-h-11">
        <Badge variant="navy" className="shrink-0">
          Breaking
        </Badge>
        <div className="min-w-0 flex-1">
          <BreakingTicker items={items} />
        </div>
      </div>
    </div>
  );
}
