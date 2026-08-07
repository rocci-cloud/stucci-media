import { getPublishedArticles } from "../lib/articles";
import BreakingTicker from "./BreakingTicker";

export default async function BreakingBar() {
  const articles = await getPublishedArticles();
  const items = articles.slice(0, 4).map((a) => ({ slug: a.slug, headline: a.headline }));

  if (items.length === 0) return null;

  return (
    <div className="bg-[var(--color-red)]">
      <div className="mx-auto max-w-[1280px] px-5 py-[9px] flex items-center gap-2.5 text-[13px] font-sans">
        <span className="bg-[var(--color-black)] text-white font-bold text-[11px] tracking-wide uppercase px-2 py-[3px] rounded-sm shrink-0">
          Breaking
        </span>
        <div className="min-w-0 flex-1">
          <BreakingTicker items={items} />
        </div>
      </div>
    </div>
  );
}
