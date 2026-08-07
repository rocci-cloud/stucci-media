import BreakingBar from "./components/BreakingBar";
import SiteHeader from "./components/SiteHeader";
import Hero from "./components/Hero";
import ArticleGrid from "./components/ArticleGrid";
import SubscribeStrip from "./components/SubscribeStrip";
import SiteFooter from "./components/SiteFooter";
import { getPublishedArticles } from "./lib/articles";

export const revalidate = 60;

export default async function HomePage() {
  const articles = await getPublishedArticles();

  if (articles.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-[1200px] px-5 py-20 text-center font-sans text-[var(--color-gray)]">
          No published stories yet.
        </main>
        <SiteFooter />
      </>
    );
  }

  const [lead, ...rest] = articles;

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main>
        <Hero lead={lead} rail={rest.slice(0, 4)} />
        <ArticleGrid articles={rest.slice(0, 3)} title="Latest Stories" />
        <SubscribeStrip />
      </main>
      <SiteFooter />
    </>
  );
}
