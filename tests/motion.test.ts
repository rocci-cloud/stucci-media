import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  imageKenBurns,
  livePipPulse,
  stickySectionLabel,
  heroCrossfadeSlide,
} from "../app/components/motion/classes";
import { HERO_CROSSFADE_MS } from "../app/components/motion/useHeroCrossfade";

const css = readFileSync("app/globals.css", "utf8");

// The 800ms ceiling is a rule about the whole system, not a per-component
// choice, so it is asserted here rather than trusted to review. The two
// documented exceptions are the hover-held Ken Burns push and the looping
// live pip, which is a state indicator rather than a transition.
const CEILING_MS = 800;

describe("motion class contract", () => {
  it("keeps the hero crossfade inside the ceiling", () => {
    const ms = Number(heroCrossfadeSlide.match(/duration-\[(\d+)ms\]/)?.[1]);
    expect(ms).toBeLessThanOrEqual(CEILING_MS);
  });

  it("rotates the hero on the interval the brief specified", () => {
    expect(HERO_CROSSFADE_MS).toBe(8000);
  });

  it("points at keyframes and utilities that actually exist in the CSS", () => {
    expect(css).toContain("@keyframes livePip");
    expect(livePipPulse).toContain("livePip");
    expect(css).toContain(".ken-burns");
    expect(imageKenBurns).toContain("ken-burns");
    expect(css).toContain(".card-enter");
  });

  it("clears the sticky nav rather than hiding under it", () => {
    expect(stickySectionLabel).toContain("sticky");
    expect(stickySectionLabel).toContain("top-[44px]");
  });
});

describe("card entrance timing", () => {
  // The stagger is nth-child delays, so the worst case is the largest
  // delay plus the transition itself. That total is what has to fit.
  it("lands the last card inside the ceiling", () => {
    const block = css.slice(css.indexOf(".card-enter"), css.indexOf(".card-enter") + 1400);
    const transition = Number(block.match(/opacity (\d+)ms/)?.[1]);
    const delays = [...block.matchAll(/transition-delay:\s*(\d+)ms/g)].map((m) => Number(m[1]));
    expect(transition).toBeGreaterThan(0);
    expect(delays.length).toBeGreaterThan(0);
    expect(Math.max(...delays) + transition).toBeLessThanOrEqual(CEILING_MS);
  });

  it("caps the stagger so a long grid does not keep accumulating delay", () => {
    expect(css).toContain("nth-child(n + 6)");
  });
});

describe("reduced motion", () => {
  it("still blankets every animation and transition globally", () => {
    const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).toContain("animation: none !important");
    expect(block).toContain("transition: none !important");
  });
});
