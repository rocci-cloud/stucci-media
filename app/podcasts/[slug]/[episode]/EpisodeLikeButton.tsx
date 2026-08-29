"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toggleEpisodeLikeAction } from "./actions";

export default function EpisodeLikeButton({
  episodeId,
  initialCount,
  initialLiked,
  isSignedIn,
  signInRedirect,
}: {
  episodeId: string;
  initialCount: number;
  initialLiked: boolean;
  isSignedIn: boolean;
  signInRedirect: string;
}) {
  const [state, setState] = useState({ liked: initialLiked, count: initialCount });
  const [optimistic, applyOptimistic] = useOptimistic(state, (current) => ({
    liked: !current.liked,
    count: current.count + (current.liked ? -1 : 1),
  }));
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (!isSignedIn) {
    return (
      <Link
        href={`/login?from=${encodeURIComponent(signInRedirect)}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-control border border-[var(--color-hairline)] px-4 font-sans text-[13px] font-bold text-[var(--color-gray)] transition hover:border-[var(--color-navy)] hover:text-[var(--color-text)]"
      >
        <Heart className="h-[17px] w-[17px]" />
        Sign in to like
        {state.count > 0 && <span className="text-[var(--color-gray-light)]">· {state.count}</span>}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-pressed={optimistic.liked}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            applyOptimistic(null);
            const result = await toggleEpisodeLikeAction(episodeId);
            if (result.success) setState({ liked: result.liked, count: result.count });
            else setError(result.error);
          })
        }
        className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 font-sans text-[13px] font-bold transition active:scale-[0.97] ${
          optimistic.liked
            ? "border-[var(--color-red)] bg-[var(--color-red)] text-white"
            : "border-[var(--color-hairline)] text-[var(--color-gray)] hover:border-[var(--color-navy)] hover:text-[var(--color-text)]"
        }`}
      >
        <Heart
          className={`h-[17px] w-[17px] transition ${optimistic.liked ? "scale-110" : ""}`}
          fill={optimistic.liked ? "currentColor" : "none"}
        />
        {optimistic.liked ? "Liked" : "Like"}
        {optimistic.count > 0 && <span className="opacity-75">· {optimistic.count}</span>}
      </button>
      {error && <p className="font-sans text-[12px] text-[var(--color-red-ink)]">{error}</p>}
    </div>
  );
}
