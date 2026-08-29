import { getBreakingArticles, getPublishedArticles } from "../lib/articles";
import { getSiteSettings } from "../lib/settings";
import BreakingTicker from "./BreakingTicker";
import Badge from "./ui/Badge";

export default async function BreakingBar() {
  const [settings, breaking] = await Promise.all([getSiteSettings(), getBreakingArticles(4)]);

  // The bar can be switched off entirely from Settings → Feature flags.
  if (!settings.featureBreakingBar) return null;

  // Editors mark stories Breaking explicitly; before anything is marked,
  // fall back to the latest published stories rather than hiding the bar.
  // The label changes with it, so the bar never claims "Breaking" about
  // something nobody flagged as breaking.
  const isCurated = breaking.length > 0;
  const source = isCurated ? breaking : (await getPublishedArticles()).slice(0, 4);
  const items = source.map((a) => ({ slug: a.slug, headline: a.headline }));

  if (items.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[var(--color-red)] to-[var(--color-red-dark)]">
      <div className="shell py-2 flex items-center gap-2.5 text-[13px] font-sans font-medium tracking-[0.005em] min-h-11">
        {/* The pip is the only thing on the bar that moves. It is a slow
            double-beat rather than a blink, so it reads as "live" from the
            corner of the eye without competing with the headline beside it. */}
        <span className="inline-flex h-[7px] w-[7px] shrink-0 rounded-full bg-white [animation:livePip_2.4s_ease-in-out_infinite]" />
        <Badge variant="navy" className="shrink-0">
          {isCurated ? "Breaking" : "Latest"}
        </Badge>
        <div className="min-w-0 flex-1">
          <BreakingTicker items={items} />
        </div>
      </div>
    </div>
  );
}
