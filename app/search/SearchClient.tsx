"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Input only — results are rendered on the server now. Typing rewrites the
// `q` param (replace, not push, so the back button doesn't have to walk back
// through every keystroke) and the server component re-renders with real
// matches. Debounced so a fast typist doesn't fire a query per character.
const DEBOUNCE_MS = 300;

export default function SearchClient({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  // The first render must not navigate — it would replace the URL the
  // visitor just arrived on with an identical one and steal focus.
  const lastPushed = useRef(initialQuery);

  useEffect(() => {
    if (query === lastPushed.current) return;
    const timer = setTimeout(() => {
      lastPushed.current = query;
      const trimmed = query.trim();
      router.replace(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search", {
        scroll: false,
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, router]);

  return (
    <input
      type="search"
      autoFocus
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search articles..."
      className="font-sans w-full min-h-11 px-4 py-3.5 border-2 border-[var(--color-hairline-strong)] rounded-control text-base mb-8 focus:border-[var(--color-red)] transition-colors"
      aria-label="Search articles"
    />
  );
}
