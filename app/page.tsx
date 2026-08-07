import BreakingBar from "./components/BreakingBar";
import SiteHeader from "./components/SiteHeader";
import FeaturedSection from "./components/FeaturedSection";
import TopicRail from "./components/TopicRail";
import Sidebar from "./components/Sidebar";
import SubscribeStrip from "./components/SubscribeStrip";
import SiteFooter from "./components/SiteFooter";
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
  // FeaturedSection). Whichever it ends up showing gets excluded from the
  // rails/sidebar below so the same story doesn't appear twice in a row.
  const featuredForSection = featuredArticles.length > 0 ? featuredArticles : articles;
  const shownSlugs = new Set(featuredForSection.slice(0, 4).map((a) => a.slug));
  const railItems = articles.filter((a) => !shownSlugs.has(a.slug));

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-[1280px] px-5 pt-6">
          <FeaturedSection featured={featuredArticles.slice(0, 4)} fallback={articles.slice(0, 4)} />
        </div>

        <div className="mx-auto max-w-[1280px] px-5 py-2 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
          <div className="flex flex-col gap-1">
            {categories.map((category, index) => (
              <TopicRail
                key={category.slug}
                category={category}
                alternate={index % 2 === 1}
                articles={railItems.filter((a) => a.categorySlug === category.slug).slice(0, 4)}
              />
            ))}
          </div>
          <div className="pt-6 lg:pt-6">
            <Sidebar articles={railItems} />
          </div>
        </div>

        <SubscribeStrip />
      </main>
      <SiteFooter />
    </>
  );
}
