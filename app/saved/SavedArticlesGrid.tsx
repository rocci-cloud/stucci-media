"use client";

import { useOptimistic, useState, useTransition } from "react";
import { BookmarkX, Loader2 } from "lucide-react";
import ArticleCard from "../components/ui/ArticleCard";
import { toggleSaveAction } from "../articles/[slug]/actions";
import type { Article } from "../lib/articles";

export default function SavedArticlesGrid({ initialArticles }: { initialArticles: Article[] }) {
  const [articles, setArticles] = useState(initialArticles);
  const [optimisticArticles, removeOptimistic] = useOptimistic(
    articles,
    (state, id: number) => state.filter((a) => a.id !== id)
  );
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<number | null>(null);

  function handleRemove(id: number) {
    setPendingId(id);
    startTransition(async () => {
      removeOptimistic(id);
      const result = await toggleSaveAction(id);
      setPendingId(null);
      if (result.success) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
      // On failure, the optimistic removal quietly reverts on next render
      // since `articles` (the committed state) never changed — no toast
      // needed for a low-stakes "unsave" action.
    });
  }

  if (optimisticArticles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-[var(--color-hairline)] px-6 py-16 text-center">
        <p className="font-sans text-[14px] font-bold text-[var(--color-text)]">Nothing saved yet</p>
        <p className="font-sans text-[13px] text-[var(--color-gray)]">
          Tap the bookmark icon on any article to read it later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {optimisticArticles.map((article) => (
        <div key={article.id} className="relative">
          <ArticleCard article={article} variant="grid" />
          <button
            type="button"
            onClick={() => handleRemove(article.id)}
            disabled={isPending && pendingId === article.id}
            aria-label={`Remove "${article.headline}" from saved articles`}
            className="absolute right-3 top-3 z-10 flex min-h-9 min-w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-[0.95] disabled:opacity-60"
          >
            {isPending && pendingId === article.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookmarkX className="h-4 w-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
