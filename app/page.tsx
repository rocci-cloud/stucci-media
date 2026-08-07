import BreakingBar from "./components/BreakingBar";
import SiteHeader from "./components/SiteHeader";
import Hero from "./components/Hero";
import TopicRail from "./components/TopicRail";
import Sidebar from "./components/Sidebar";
import SubscribeStrip from "./components/SubscribeStrip";
import SiteFooter from "./components/SiteFooter";
import { getPublishedArticles } from "./lib/articles";
import { categories } from "./lib/categories";

export const revalidate = 60;

export default async function HomePage() {
  const articles = await getPublishedArticles();

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

  const [lead, ...rest] = articles;
  const railItems = rest.filter((a) => a.slug !== lead.slug);

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-[1280px] px-5 pt-6">
          <Hero lead={lead} rail={railItems.slice(0, 4)} />
        </div>

        <div className="mx-auto max-w-[1280px] px-5 py-2 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
          <div className="flex flex-col gap-1">
            {categories.map((category, index) => (
              <TopicRail
                key={category.slug}
                category={category}
                alternate={index % 2 === 1}
                articles={articles
                  .filter((a) => a.categorySlug === category.slug && a.slug !== lead.slug)
                  .slice(0, 4)}
              />
            ))}
          </div>
          <div className="pt-6 lg:pt-6">
            <Sidebar articles={railItems} excludeSlug={lead.slug} />
          </div>
        </div>

        <SubscribeStrip />
      </main>
      <SiteFooter />
    </>
  );
}
