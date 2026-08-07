"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { articles } from "../lib/articles";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return articles.filter(
      (a) =>
        a.headline.toLowerCase().includes(q) ||
        a.dek.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main className="max-w-[720px] mx-auto px-5 pt-10 pb-20">
        <h1 className="font-headline text-[32px] sm:text-[42px] font-black tracking-[-0.01em] mb-6">
          Search
        </h1>
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="font-sans w-full px-4 py-3.5 border-2 border-[var(--color-hairline-strong)] rounded-sm text-base mb-8"
          aria-label="Search articles"
        />

        {query.trim() && (
          <p className="font-sans text-sm text-[var(--color-gray)] mb-5">
            {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
          </p>
        )}

        <div className="flex flex-col gap-6">
          {results.map((a) => (
            <Link key={a.slug} href={`/articles/${a.slug}`} className="block group border-b border-[var(--color-hairline)] pb-6">
              <span className="font-sans block text-[11px] font-bold uppercase tracking-wide text-[var(--color-red)] mb-1.5">
                {a.category}
              </span>
              <div className="font-headline text-[20px] font-bold leading-[1.3] mb-1.5 group-hover:underline">
                {a.headline}
              </div>
              <p className="text-sm text-[var(--color-gray)] leading-[1.5]">{a.dek}</p>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
