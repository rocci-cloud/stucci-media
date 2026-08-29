"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export const HERO_CROSSFADE_MS = 8000;

/**
 * Drives a rotating hero: which slide is showing, and how to change it.
 *
 * Reduced motion stops the rotation entirely rather than shortening it. An
 * 8-second content swap is not a transition to speed up — it is unrequested
 * movement, which is the thing the preference exists to prevent. The manual
 * controls keep working.
 *
 * Rotation also pauses on hover and on focus, so a reader reaching for the
 * headline does not have it replaced under the cursor.
 */
export function useHeroCrossfade(count: number, intervalMs = HERO_CROSSFADE_MS) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (count <= 1 || paused || reduced) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearInterval(id);
  }, [count, paused, reduced, intervalMs, index]);

  const goTo = useCallback((next: number) => setIndex(next), []);

  return {
    index,
    goTo,
    /** Spread onto the hero container. */
    pauseHandlers: {
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
      onFocusCapture: () => setPaused(true),
      onBlurCapture: () => setPaused(false),
    },
  };
}
