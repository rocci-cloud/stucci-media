"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toggleLikeAction } from "./actions";

export default function LikeButton({
  articleId,
  initialCount,
  initialLiked,
  isSignedIn,
  signInRedirect,
}: {
  articleId: number;
  initialCount: number;
  initialLiked: boolean;
  isSignedIn: boolean;
  signInRedirect: string;
}) {
  const [state, setState] = useState({ liked: initialLiked, count: initialCount });
  const [optimisticState, applyOptimistic] = useOptimistic(
    state,
    (current, liked: boolean) => ({ liked, count: current.count + (liked ? 1 : -1) })
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <Link
        href={`/login?from=${encodeURIComponent(signInRedirect)}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-hairline-strong)] px-4 font-sans text-[13.5px] font-bold text-[var(--color-gray)] transition-colors hover:border-[var(--color-red)] hover:text-[var(--color-red-ink)]"
      >
        <Heart className="h-[18px] w-[18px]" />
        {state.count > 0 ? `${state.count} Like${state.count === 1 ? "" : "s"}` : "Like"}
      </Link>
    );
  }

  function handleClick() {
    const nextLiked = !state.liked;
    setError(null);
    startTransition(async () => {
      applyOptimistic(nextLiked);
      const result = await toggleLikeAction(articleId);
      if (result.success) {
        setState({ liked: result.liked, count: result.count });
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
        aria-pressed={optimisticState.liked}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-sans text-[13.5px] font-bold transition disabled:opacity-60 ${
          optimisticState.liked
            ? "border-[var(--color-red)] bg-[var(--color-red)] text-white"
            : "border-[var(--color-hairline-strong)] text-[var(--color-gray)] hover:border-[var(--color-red)] hover:text-[var(--color-red-ink)]"
        }`}
      >
        <Heart
          className={`h-[18px] w-[18px] transition-transform duration-300 ${optimisticState.liked ? "scale-110" : "scale-100"}`}
          fill={optimisticState.liked ? "currentColor" : "none"}
        />
        {optimisticState.count > 0
          ? `${optimisticState.count} Like${optimisticState.count === 1 ? "" : "s"}`
          : "Like"}
      </button>
      {error && <p className="text-[12px] text-[var(--color-red-ink)]">{error}</p>}
    </div>
  );
}
