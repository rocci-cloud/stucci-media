"use client";

import { useEffect, useRef, useState } from "react";

// Wraps a server-rendered module (CategoryBand, PodcastModule, etc.) and
// fades/rises it in the first time it scrolls into view, via a plain
// IntersectionObserver + CSS transition — no animation library. Restrained
// on purpose: one reveal per module, not per-card, so the page doesn't
// turn into a staggered confetti of entrances. `prefers-reduced-motion`
// is already handled globally (globals.css forces all transitions/
// animations off), so this component doesn't need its own check.
//
// Content renders fully visible by default (both on the server and on
// first client paint) — this is a news site, so nothing should ever
// depend on JS running to become visible. `armed` only flips true once
// the observer's first callback confirms the element is NOT already on
// screen at mount; anything already in the initial viewport (most of
// what's above the fold) simply never enters the hidden state at all,
// so there's no flash for the content a visitor sees first.
export default function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        } else {
          setArmed(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hidden = armed && !visible;

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ${
        hidden ? "opacity-0 translate-y-5" : "opacity-100 translate-y-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
