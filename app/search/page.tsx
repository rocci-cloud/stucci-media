import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { getPublishedArticles } from "../lib/articles";
import SearchClient from "./SearchClient";

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const [articles, { q }] = await Promise.all([getPublishedArticles(), searchParams]);

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main className="max-w-[720px] mx-auto px-5 pt-10 pb-20">
        <h1 className="font-headline text-[34px] sm:text-[46px] font-bold uppercase leading-[0.98] tracking-[-0.015em] mb-6">
          Search
        </h1>
        <SearchClient articles={articles} initialQuery={q ?? ""} />
      </main>
      <SiteFooter />
    </>
  );
}
