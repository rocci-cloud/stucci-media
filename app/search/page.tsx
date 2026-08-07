import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { getPublishedArticles } from "../lib/articles";
import SearchClient from "./SearchClient";

export const revalidate = 60;

export default async function SearchPage() {
  const articles = await getPublishedArticles();

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main className="max-w-[720px] mx-auto px-5 pt-10 pb-20">
        <h1 className="font-headline text-[32px] sm:text-[42px] font-black tracking-[-0.01em] mb-6">
          Search
        </h1>
        <SearchClient articles={articles} />
      </main>
      <SiteFooter />
    </>
  );
}
