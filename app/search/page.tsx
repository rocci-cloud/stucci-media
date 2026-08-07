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
        <h1 className="font-headline text-[32px] sm:text-[42px] font-bold uppercase tracking-[-0.005em] mb-6">
          Search
        </h1>
        <SearchClient articles={articles} initialQuery={q ?? ""} />
      </main>
      <SiteFooter />
    </>
  );
}
