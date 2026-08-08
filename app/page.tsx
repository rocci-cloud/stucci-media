import BreakingBar from "./components/BreakingBar";
import SiteHeader from "./components/SiteHeader";
import FeaturedSection from "./components/FeaturedSection";
import LatestModule from "./components/LatestModule";
import TopicRail from "./components/TopicRail";
import OpinionModule from "./components/OpinionModule";
import PodcastShelf from "./components/PodcastShelf";
import Sidebar from "./components/Sidebar";
import SubscribeStrip from "./components/SubscribeStrip";
import SiteFooter from "./components/SiteFooter";
import Reveal from "./components/Reveal";
import BannerSlot from "./components/BannerSlot";
import { getPublishedArticles, getFeaturedArticles } from "./lib/articles";
import { getCategories } from "./lib/categories";

export const revalidate = 60;

export default async function HomePage() {
  const [articles, featuredArticles, categories] = await Promise.all([
    getPublishedArticles(),
    getFeaturedArticles(),
    getCategories(),
  ]);

  if (articles.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-[1280px] px-5 py-20 text-center font-sans text-[var(--color-gray)]">
          No published stories yet.
        </main>
        <SiteFooter />
      </>
    );
  }

  // The Featured section shows up to 4 stories (curated, or — if nothing's
  // marked Featured yet — the most recent as a graceful fallback; see
  // FeaturedSection). Whichever it ends up showing gets excluded below so
  // the same story doesn't appear twice in a row.
  const featuredForSection = featuredArticles.length > 0 ? featuredArticles : articles;
  const shownSlugs = new Set(featuredForSection.slice(0, 4).map((a) => a.slug));
  const afterFeatured = articles.filter((a) => !shownSlugs.has(a.slug));

  // "Latest" is its own recency-first wire desk above the category
  // modules — same exclusion pattern as Featured, so nothing shows twice.
  const latestItems = afterFeatured.slice(0, 6);
  latestItems.forEach((a) => shownSlugs.add(a.slug));
  const railItems = afterFeatured.filter((a) => !shownSlugs.has(a.slug));

  // Opinion & Analysis and Podcasts get their own distinct module layouts
  // (OpinionModule, PodcastShelf) instead of the standard TopicRail
  // lead+briefs treatment — see those components for why. `topicRailIndex`
  // tracks position only among the standard TopicRail modules, so the
  // alternating background rhythm stays clean between same-type modules
  // instead of skipping a beat whenever a specialty module sits between them.
  let topicRailIndex = 0;

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main>
        <FeaturedSection featured={featuredArticles.slice(0, 4)} fallback={articles.slice(0, 4)} />

        <div className="mx-auto max-w-[1280px] px-5">
          <Reveal>
            <LatestModule articles={latestItems} />
          </Reveal>
        </div>

        {/* Homepage's one fixed banner slot — mid-content, between the
            top wire desk and the category rail stack. BannerSlot returns
            null with zero DOM output when there's no active banner, so
            this never leaves an empty box behind. */}
        <BannerSlot placement="HOMEPAGE" className="mx-auto max-w-[1280px] px-5 py-4" />

        <div className="mx-auto max-w-[1280px] px-5 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
          <div className="flex flex-col">
            {categories.map((category) => {
              if (category.slug === "opinion-analysis") {
                const categoryArticles = railItems.filter((a) => a.categorySlug === category.slug).slice(0, 6);
                return (
                  <Reveal key={category.slug}>
                    <OpinionModule category={category} articles={categoryArticles} />
                  </Reveal>
                );
              }
              if (category.slug === "podcasts") {
                const categoryArticles = railItems.filter((a) => a.categorySlug === category.slug).slice(0, 6);
                return (
                  <Reveal key={category.slug}>
                    <PodcastShelf category={category} articles={categoryArticles} />
                  </Reveal>
                );
              }
              const alternate = topicRailIndex % 2 === 1;
              topicRailIndex += 1;
              return (
                <Reveal key={category.slug}>
                  <TopicRail
                    category={category}
                    alternate={alternate}
                    articles={railItems.filter((a) => a.categorySlug === category.slug).slice(0, 4)}
                  />
                </Reveal>
              );
            })}
          </div>
          <div className="pt-3 lg:pt-4">
            <Reveal>
              <Sidebar articles={railItems} />
            </Reveal>
          </div>
        </div>

        <Reveal>
          <SubscribeStrip />
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
