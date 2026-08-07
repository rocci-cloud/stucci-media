import BreakingBar from "./components/BreakingBar";
import SiteHeader from "./components/SiteHeader";
import Hero from "./components/Hero";
import ArticleGrid from "./components/ArticleGrid";
import SubscribeStrip from "./components/SubscribeStrip";
import SiteFooter from "./components/SiteFooter";
import { articles } from "./lib/articles";

export default function HomePage() {
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
