"use client";

import { useEffect, useState } from "react";

/**
 * A hairline progress bar pinned under the sticky nav.
 *
 * Measures the article element rather than the document, so the bar reads
 * 100% when the story ends — not when the comments, the related rail and
 * the footer have also scrolled past. A bar that is still at 60% when a
 * reader finishes reading is worse than no bar.
 *
 * Updates are rAF-throttled: scroll fires far more often than the browser
 * paints, and setting state on every event is how a progress bar becomes
 * the reason a page feels heavy.
 */
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      // Distance scrolled into the article, over the distance it can scroll.
      const scrolled = -rect.top;
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(scrolled > 0 ? 1 : 0);
        return;
      }
      setProgress(Math.min(1, Math.max(0, scrolled / scrollable)));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  return (
    <div
      aria-hidden
      className="sticky top-[44px] z-20 h-[3px] w-full bg-[var(--color-hairline)]"
    >
      <div
        className="h-full origin-left bg-[var(--color-red)]"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
