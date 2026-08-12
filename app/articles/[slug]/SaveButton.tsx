"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { toggleSaveAction } from "./actions";

export default function SaveButton({
  articleId,
  initialSaved,
  isSignedIn,
  signInRedirect,
}: {
  articleId: number;
  initialSaved: boolean;
  isSignedIn: boolean;
  signInRedirect: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [optimisticSaved, applyOptimistic] = useOptimistic(saved, (_current, next: boolean) => next);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <Link
        href={`/login?from=${encodeURIComponent(signInRedirect)}`}
        aria-label="Sign in to save this article"
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-[var(--color-hairline-strong)] px-4 font-sans text-[13.5px] font-bold text-[var(--color-gray)] transition-colors hover:border-[var(--color-red)] hover:text-[var(--color-red)]"
      >
        <Bookmark className="h-[18px] w-[18px]" />
      </Link>
    );
  }

  function handleClick() {
    const next = !saved;
    setError(null);
    startTransition(async () => {
      applyOptimistic(next);
      const result = await toggleSaveAction(articleId);
      if (result.success) {
        setSaved(result.saved);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={optimisticSaved}
        aria-label={optimisticSaved ? "Remove from saved articles" : "Save article for later"}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border px-4 font-sans text-[13.5px] font-bold transition disabled:opacity-60 ${
          optimisticSaved
            ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
            : "border-[var(--color-hairline-strong)] text-[var(--color-gray)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
        }`}
      >
        <Bookmark
          className="h-[18px] w-[18px] transition-transform duration-300"
          fill={optimisticSaved ? "currentColor" : "none"}
        />
        {optimisticSaved ? "Saved" : "Save"}
      </button>
      {error && <p className="text-[12px] text-[var(--color-red)]">{error}</p>}
    </div>
  );
}
