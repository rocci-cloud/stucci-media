"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Article } from "../lib/articles";
import Badge from "../components/ui/Badge";

export default function SearchClient({ articles }: { articles: Article[] }) {
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
  }, [query, articles]);

  return (
    <>
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="font-sans w-full min-h-11 px-4 py-3.5 border-2 border-[var(--color-hairline-strong)] rounded-control text-base mb-8 focus:border-[var(--color-red)] transition-colors"
        aria-label="Search articles"
      />

      {query.trim() && (
        <p className="font-sans text-sm text-[var(--color-gray)] mb-5">
          {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
        </p>
      )}

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
    </>
  );
}
