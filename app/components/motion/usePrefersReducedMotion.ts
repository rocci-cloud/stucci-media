"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the reader's reduced-motion setting, and keeps tracking it — the
 * preference can change while the page is open (a system toggle, or an OS
 * focus mode switching on), and a value read once at mount would go stale.
 *
 * Starts `false` so the server and the first client paint agree; anything
 * that would be wrong for one frame belongs behind the effect, not in the
 * initial state.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
