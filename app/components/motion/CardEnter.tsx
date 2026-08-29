"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Fades a grid's cards in once, the first time the grid reaches the
 * viewport.
 *
 * Wraps the *grid*, not each card, for two reasons. Cards stay server
 * components — turning thirty of them into client components to animate an
 * opacity would ship their markup twice and cost more than the effect is
 * worth. And one observer per grid means a homepage with two hundred cards
 * still has a handful of observers rather than two hundred.
 *
 * The per-card stagger is CSS `nth-child` delays (see `.card-enter` in
 * globals.css), capped so the last card in a row still finishes inside
 * 800ms.
 *
 * Two behaviours worth stating, both deliberate:
 *   - It fires ONCE. Scrolling back up does not replay it; a page that
 *     re-animates on every pass is the thing this is meant to avoid.
 *   - Content is visible by default and only arms if the observer confirms
 *     the grid is off-screen at mount. Anything above the fold never enters
 *     a hidden state, so nothing a reader sees first depends on JS running.
 */
export default function CardEnter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [entered, setEntered] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        } else {
          // Off-screen at first callback: safe to hide and animate in.
          setArmed(true);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  const state = !armed || entered || reduced ? "in" : "out";

  return (
    <div ref={ref} data-enter={state} className={`card-enter ${className}`}>
      {children}
    </div>
  );
}
