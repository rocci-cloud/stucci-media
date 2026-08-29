"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Article } from "../lib/articles";

const ROTATE_MS = 8000;

// The homepage's rotating lead. Two to three curated stories, crossfading
// under a lower-third that wipes in the way a broadcast caption does.
//
// Three things this is built around, all of which constrain the markup:
//
// 1. LCP. Every slide is in the DOM from the first paint inside a
//    fixed-height frame, so a rotation can never move the page and the
//    hero can never shift as images arrive. Only slide 0 gets `priority`
//    — marking all three would have them compete for the same early
//    bandwidth and make the one the reader actually sees arrive later.
// 2. Exactly one <h1>. Every template on this site has one and Phase 31
//    verified it. With three captions mounted at once, the active slide's
//    headline renders as <h1> and the others as <p> — the element moves
//    with the rotation, so the count is always one.
// 3. Crawlers and no-JS readers see slide 0 fully rendered and linked;
//    rotation is an enhancement on top, never the thing that makes the
//    lead story reachable.
export default function HeroRotator({ articles }: { articles: Article[] }) {
  const slides = articles.slice(0, 3);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = query.matches;
    const onChange = () => {
      reducedMotion.current = query.matches;
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    // A reader who asked for reduced motion gets the lead story and no
    // rotation at all — an 8-second content swap is exactly the kind of
    // unrequested movement that preference is about, not just a transition
    // to shorten.
    if (reducedMotion.current) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [slides.length, paused, index]);

  const go = useCallback((next: number) => {
    setIndex(next);
  }, []);

  if (slides.length === 0) return null;

  return (
    <section
      aria-label="Featured stories"
      className="relative isolate w-full overflow-hidden bg-[var(--color-navy-dark)] h-[78svh] min-h-[520px] max-h-[760px] sm:h-[70vh] sm:max-h-[680px] lg:h-[660px] lg:max-h-[76vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((article, i) => {
        const active = i === index;
        const Headline = active ? "h1" : "p";
        return (
          <div
            key={article.slug}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-[900ms] ${
              active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {article.coverImageUrl ? (
              <Image
                src={article.coverImageUrl}
                alt={article.headline}
                fill
                priority={i === 0}
                sizes="100vw"
                className="img-cinematic object-cover"
              />
            ) : (
              <div className="img-placeholder absolute inset-0" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.3)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/5" />

            <div className="absolute inset-x-0 bottom-0 pb-16 sm:pb-20">
              <div className="shell">
                {/* Keyed on the slide index so the wipe replays on every
                    change rather than only on first mount. */}
                <div
                  key={`${article.slug}-${index}`}
                  className={
                    active
                      ? "[animation:lowerThirdWipe_0.7s_cubic-bezier(0.16,1,0.3,1)_both]"
                      : ""
                  }
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.1em]">
                    <span className="bg-[var(--color-red)] px-2.5 py-1 text-white">
                      {article.isExclusive ? "Exclusive" : "Featured"}
                    </span>
                    <span
                      className={
                        article.categorySlug === "veterans"
                          ? "text-[var(--color-gold)]"
                          : "text-white/85"
                      }
                    >
                      {article.category}
                    </span>
                  </div>
                  <Headline className="font-headline font-bold uppercase text-white text-[length:clamp(2.5rem,6vw,5.5rem)] leading-[0.9] tracking-[-0.025em] max-w-[17ch]">
                    <Link href={`/articles/${article.slug}`} className="hover:underline decoration-[3px] underline-offset-[10px]">
                      {article.headline}
                    </Link>
                  </Headline>
                  <p className="mt-4 max-w-[62ch] font-sans text-[16px] sm:text-[19px] leading-[1.5] text-white/85 line-clamp-2">
                    {article.dek}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-2.5 font-sans text-[12.5px] tracking-[0.02em] text-white/80">
                    <span className="font-bold text-white">{article.author}</span>
                    <span aria-hidden>·</span>
                    <span>{article.date}</span>
                    <span aria-hidden>·</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="shell flex items-center gap-2.5 pb-5">
            {slides.map((article, i) => (
              <button
                key={article.slug}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show story ${i + 1}: ${article.headline}`}
                aria-current={i === index}
                className="group/pip flex h-11 w-14 items-end pb-4"
              >
                <span
                  className={`block h-[3px] w-full transition-colors ${
                    i === index
                      ? "bg-[var(--color-red)]"
                      : "bg-white/35 group-hover/pip:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
