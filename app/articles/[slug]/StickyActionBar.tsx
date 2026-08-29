"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Share and listen, pinned to the bottom on phones only.
 *
 * Appears once the reader is actually into the story rather than on load —
 * a bar covering the bottom of the screen before anyone has read a
 * paragraph is a toolbar in the way, not an affordance. Hidden again near
 * the end so it does not sit on top of the comment box.
 *
 * `lg:hidden` because the desktop layout already has both controls in the
 * byline area and a rail with room to spare.
 */
export default function StickyActionBar({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > 600 && (max <= 0 || y < max - 400));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 py-2 transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {children}
    </div>
  );
}
