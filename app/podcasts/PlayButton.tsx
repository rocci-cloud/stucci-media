"use client";

import { Play, Pause, AudioLines } from "lucide-react";
import { usePlayer, type PlayableEpisode } from "./PlayerProvider";

/**
 * Starts (or pauses) an episode in the section-wide player.
 *
 * Three sizes rather than one flexible component: the hero's button is a
 * real call to action, a card's is a control, and a list row's is an
 * affordance — they want genuinely different proportions, not one size
 * scaled.
 */
export default function PlayButton({
  episode,
  variant = "row",
  label,
}: {
  episode: PlayableEpisode | null;
  variant?: "hero" | "card" | "row";
  label?: string;
}) {
  const player = usePlayer();

  // No audio in the feed item, or rendered outside the podcast section:
  // show nothing rather than a button that cannot do anything.
  if (!episode || !player) return null;

  const isCurrent = player.current?.id === episode.id;
  const isPlaying = isCurrent && player.isPlaying;

  if (variant === "hero") {
    return (
      <button
        type="button"
        onClick={() => player.toggle(episode)}
        className="inline-flex min-h-11 items-center gap-2.5 rounded-control bg-[var(--color-red)] px-6 py-3 font-sans text-[13px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97]"
      >
        {isPlaying ? (
          <Pause className="h-[18px] w-[18px]" fill="currentColor" />
        ) : (
          <Play className="h-[18px] w-[18px]" fill="currentColor" />
        )}
        {isPlaying ? "Pause" : (label ?? "Play episode")}
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={() => player.toggle(episode)}
        aria-label={isPlaying ? `Pause ${episode.title}` : `Play ${episode.title}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-white transition hover:bg-[var(--color-red)] active:scale-[0.94]"
      >
        {isPlaying ? (
          <Pause className="h-[17px] w-[17px]" fill="currentColor" />
        ) : (
          <Play className="ml-0.5 h-[17px] w-[17px]" fill="currentColor" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => player.toggle(episode)}
      aria-label={isPlaying ? `Pause ${episode.title}` : `Play ${episode.title}`}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition active:scale-[0.94] ${
        isCurrent
          ? "border-[var(--color-red)] bg-[var(--color-red)] text-white"
          : "border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-navy)] hover:border-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white"
      }`}
    >
      {isPlaying ? (
        <AudioLines className="h-4 w-4" />
      ) : (
        <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
      )}
    </button>
  );
}
