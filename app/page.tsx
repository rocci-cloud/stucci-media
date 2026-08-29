import { headers } from "next/headers";
import BreakingBar from "./components/BreakingBar";
import SiteHeader from "./components/SiteHeader";
import HeroRotator from "./components/HeroRotator";
import HeadlineMosaic from "./components/HeadlineMosaic";
import CategoryBand from "./components/CategoryBand";
import PersonalizedRail from "./components/PersonalizedRail";
import LatestModule from "./components/LatestModule";
import PodcastModule from "./components/PodcastModule";
import SubscribeStrip from "./components/SubscribeStrip";
import SiteFooter from "./components/SiteFooter";
import Reveal from "./components/Reveal";
import BannerSlot from "./components/BannerSlot";
import ServicePromo from "./components/ServicePromo";
import { getPublishedArticles, getFeaturedArticles, getPersonalizedArticles } from "./lib/articles";
import { getCategories } from "./lib/categories";
import { getActivePodcasts, getLatestEpisodes } from "./lib/podcasts";
import { getTopCategorySlugs } from "./lib/interests";
import { auth } from "./lib/auth";

// A signed-in reader's session gates the personalized rail below, which
// opts this page out of the static/ISR path (same tradeoff the article
// page already made in Phase 12) — `revalidate` still applies to the
// underlying data fetches, just not the page shell itself.
export const revalidate = 60;

// How many stories each block consumes, in the order they take them. The
// numbers live here rather than inside each component because they only
// make sense against each other: this is the page's editorial budget, and
// changing one changes what is left for the next block down.
const HERO_COUNT = 3;
const MOSAIC_COUNT = 7; // 1 lead + 2 stacked + a 4-up rail
const BAND_COUNT = 4; // 1 lead + 3 compact

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const [articles, featuredArticles, categories, personalizedArticles, podcastShows, podcastEpisodes] =
    await Promise.all([
    getPublishedArticles(),
    getFeaturedArticles(),
    getCategories(),
    session
      ? getTopCategorySlugs(session.user.id).then((slugs) => getPersonalizedArticles(slugs, 4))
      : Promise.resolve([]),
    getActivePodcasts(),
    getLatestEpisodes(5),
  ]);

  if (articles.length === 0) {
    return (
      <>
        <SiteHeader />
        <main id="main-content" className="shell py-20 text-center font-sans text-[var(--color-gray)]">
          No published stories yet.
        </main>
        <SiteFooter />
      </>
    );
  }

  // The hero shows what an editor actually marked Featured; with nothing
  // curated it falls back to the most recent, same honest-fallback rule
  // the old FeaturedSection used. Every block below takes from what is
  // left, so a story never appears twice on the page.
  const heroSource = featuredArticles.length > 0 ? featuredArticles : articles;
  const heroItems = heroSource.slice(0, HERO_COUNT);
  const used = new Set(heroItems.map((a) => a.slug));

  const take = (pool: typeof articles, count: number) => {
    const picked = pool.filter((a) => !used.has(a.slug)).slice(0, count);
    picked.forEach((a) => used.add(a.slug));
    return picked;
  };

  const mosaicItems = take(articles, MOSAIC_COUNT);
  const personalizedForRail = take(personalizedArticles, 4);

  // Bands are built in the admin's own category order, each taking the
  // freshest unused stories in its section. A category with nothing left
  // renders nothing at all rather than a half-empty band.
  const bands = categories
    .map((category) => ({
      category,
      articles: take(
        articles.filter((a) => a.categorySlug === category.slug),
        BAND_COUNT,
      ),
    }))
    .filter((band) => band.articles.length > 0);

  // Whatever the shaped blocks did not use runs as a dense wire at the
  // foot of the page — recency, no hierarchy, no wasted height.
  const wireItems = articles.filter((a) => !used.has(a.slug)).slice(0, 12);

  const [podcastLead] = podcastEpisodes;

  return (
    <div className="desk-wide">
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        <HeroRotator articles={heroItems} />

        <HeadlineMosaic articles={mosaicItems} />

        {personalizedForRail.length > 0 && (
          <div className="shell pt-5">
            <Reveal>
              <PersonalizedRail articles={personalizedForRail} />
            </Reveal>
          </div>
        )}

        {/* The listen desk sits above the category bands: it is the one
            module driven by feeds rather than the newsroom, and burying it
            under seven text modules is how the shows stayed invisible. */}
        {podcastLead && (
          <div className="pt-5 sm:pt-7">
            <Reveal>
              <PodcastModule
                lead={podcastLead}
                shows={podcastShows}
                recent={podcastEpisodes.slice(1, 5)}
              />
            </Reveal>
          </div>
        )}

        {bands.map((band) => (
          <Reveal key={band.category.slug}>
            <CategoryBand category={band.category} articles={band.articles} />
          </Reveal>
        ))}

        {wireItems.length > 0 && (
          <div className="shell pt-6 sm:pt-8">
            <Reveal>
              <LatestModule articles={wireItems} />
            </Reveal>
          </div>
        )}

        {/* Homepage's one fixed banner slot, and the service promo. Both sit
            below the editorial stack rather than interrupting it — BannerSlot
            returns null with zero DOM output when nothing is active, so this
            never leaves an empty box behind. */}
        <div className="shell my-7 sm:my-9">
          <ServicePromo />
        </div>
        <BannerSlot placement="HOMEPAGE" className="shell py-4" />

        <Reveal>
          <SubscribeStrip />
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
