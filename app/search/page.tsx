import type { Metadata } from "next";
import Link from "next/link";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Badge from "../components/ui/Badge";
import { searchPublishedArticles } from "../lib/articles";
import SearchClient from "./SearchClient";

// Results depend on ?q=, so this can't be prerendered on a timer.
export const dynamic = "force-dynamic";

// Query-string search results are inherently thin/duplicate content
// (the same articles re-sliced by whatever ?q= a visitor typed) — kept
// crawlable so link equity still flows, but excluded from the index so
// it doesn't compete with real editorial pages in search results.
export const metadata: Metadata = {
  title: "Search",
  description: "Search Stucci Media's articles and investigations.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/search",
  },
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchPublishedArticles(query) : [];

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content" className="max-w-[720px] mx-auto px-5 pt-10 pb-20">
        <h1 className="font-headline text-[34px] sm:text-[46px] font-bold uppercase leading-[0.98] tracking-[-0.015em] mb-6">
          Search
        </h1>

        <SearchClient initialQuery={query} />

        {query && (
          <p className="font-sans text-sm text-[var(--color-gray)] mb-5">
            {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
          </p>
        )}

        {query && results.length === 0 ? (
          <p className="font-sans text-[15px] text-[var(--color-gray)] leading-[1.6]">
            Nothing matched that. Try a different word, or browse the{" "}
            <Link href="/" className="font-bold text-[var(--color-red)] hover:underline">
              latest stories
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {results.map((a) => (
              <Link
                key={a.slug}
                href={`/articles/${a.slug}`}
                className="block group border-b border-[var(--color-hairline)] pb-6 min-h-11"
              >
                <Badge variant="text" className="mb-1.5">
                  {a.category}
                </Badge>
                <div className="font-headline text-[20px] font-bold leading-[1.3] mb-1.5 group-hover:text-[var(--color-red)] transition-colors">
                  {a.headline}
                </div>
                <p className="text-sm text-[var(--color-gray)] leading-[1.5]">{a.dek}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
