import { headers } from "next/headers";
import BreakingBar from "./components/BreakingBar";
import SiteHeader from "./components/SiteHeader";
import LeadPackage from "./components/LeadPackage";
import HeadlineMosaic from "./components/HeadlineMosaic";
import CategoryGrid from "./components/CategoryGrid";
import PersonalizedRail from "./components/PersonalizedRail";
import PodcastModule from "./components/PodcastModule";
import SubscribeStrip from "./components/SubscribeStrip";
import SiteFooter from "./components/SiteFooter";
import Reveal from "./components/Reveal";
import BannerSlot from "./components/BannerSlot";
import ServicePromo from "./components/ServicePromo";
import { getPublishedArticles, getFeaturedArticles, getPersonalizedArticles } from "./lib/articles";
import { getCategories } from "./lib/categories";
import { getActivePodcasts, getLatestEpisodes, getLatestEpisodeDateByShow } from "./lib/podcasts";
import { getTopCategorySlugs } from "./lib/interests";
import { getCommentCountsForArticles } from "./lib/comments";
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
const LEAD_COUNT = 1; // the top story, on its own
const MOSAIC_COUNT = 5; // 1 medium + a 4-up compact rail
const BAND_COUNT = 6; // two full rows at three columns

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const [articles, featuredArticles, categories, personalizedArticles, podcastShows, podcastEpisodes, latestByShow] =
    await Promise.all([
    getPublishedArticles(),
    getFeaturedArticles(),
    getCategories(),
    session
      ? getTopCategorySlugs(session.user.id).then((slugs) => getPersonalizedArticles(slugs, 4))
      : Promise.resolve([]),
    getActivePodcasts(),
    getLatestEpisodes(11),
    getLatestEpisodeDateByShow(),
  ]);

  if (articles.length === 0) {
    return (
      <>
        <SiteHeader />
        <main id="main-content" className="shell py-14 text-center font-sans text-[var(--color-gray)]">
          No published stories yet.
        </main>
        <SiteFooter />
      </>
    );
  }

  // The hero shows what an editor actually marked Featured; with nothing
  // curated it falls back to the most recent, same honest-fallback rule
  // this page has always used. Every block below takes from what is
  // left, so a story never appears twice on the page.
  const leadSource = featuredArticles.length > 0 ? featuredArticles : articles;
  const leadItems = leadSource.slice(0, LEAD_COUNT);
  const used = new Set(leadItems.map((a) => a.slug));

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

  // Comment counts for the band cards' meta rows. One groupBy for every
  // card on the page rather than a count per card, and only for the
  // articles actually rendered in a band.
  const commentCounts = await getCommentCountsForArticles(
    bands.flatMap((band) => band.articles.map((a) => a.id)),
  );

  // Whatever the shaped blocks did not use runs through the same mosaic
  // rather than a row of equal cards. The old wire grid was three
  // 88x60px thumbnails across, which read as small and left the row
  // mostly empty at 1440.
  const overflowItems = articles.filter((a) => !used.has(a.slug)).slice(0, MOSAIC_COUNT);

  const [podcastLead] = podcastEpisodes;

  return (
    <div className="desk-wide">
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        <div className="shell pt-3 sm:pt-4">
          {leadItems[0] && <LeadPackage article={leadItems[0]} />}
        </div>

        <HeadlineMosaic articles={mosaicItems} />

        {personalizedForRail.length > 0 && (
          <div className="shell pt-3.5">
            <Reveal>
              <PersonalizedRail articles={personalizedForRail} />
            </Reveal>
          </div>
        )}

        {/* The listen desk sits above the category bands: it is the one
            module driven by feeds rather than the newsroom, and burying it
            under seven text modules is how the shows stayed invisible. */}
        {podcastLead && (
          <div className="pt-3.5 sm:pt-5">
            <Reveal>
              <PodcastModule
                lead={podcastLead}
                shows={podcastShows}
                recent={podcastEpisodes.slice(1)}
                latestByShow={latestByShow}
              />
            </Reveal>
          </div>
        )}

        {bands.map((band) => (
          <Reveal key={band.category.slug}>
            <CategoryGrid
              category={band.category}
              articles={band.articles}
              commentCounts={commentCounts}
            />
          </Reveal>
        ))}

        {overflowItems.length > 0 && (
          <Reveal>
            <HeadlineMosaic articles={overflowItems} title="More Headlines" />
          </Reveal>
        )}

        {/* Homepage's one fixed banner slot, and the service promo. Both sit
            below the editorial stack rather than interrupting it — BannerSlot
            returns null with zero DOM output when nothing is active, so this
            never leaves an empty box behind. */}
        <div className="shell my-5 sm:my-6">
          <ServicePromo />
        </div>
        <BannerSlot placement="HOMEPAGE" className="shell py-3" />

        <Reveal>
          <SubscribeStrip />
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
