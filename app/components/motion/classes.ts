/**
 * Shared motion class strings.
 *
 * These are plain constants rather than components: every one of them
 * applies to a server-rendered element, and a wrapper component would turn
 * a static card into a client component to add a class name.
 *
 * Every duration here is at or under 800ms except `imageKenBurns`, which is
 * a hover-held push and is meant to be slow. The looping `livePipPulse` is
 * not a transition — it is a state indicator, and its 2.4s cycle is the
 * beat that keeps it readable as "live" rather than a strobe.
 */

/** Slow push on a still image while hovered. Pair with a `group` parent. */
export const imageKenBurns = "ken-burns transform-gpu";

/** The "this is live" dot. Slow double-beat, not a blink. */
export const livePipPulse = "[animation:livePip_2.4s_ease-in-out_infinite]";

/**
 * A section label that stays put while its own band scrolls past, then
 * releases to the next one. `top` clears the sticky nav.
 */
export const stickySectionLabel =
  "sticky top-[44px] z-20 -mx-[var(--gutter)] bg-[var(--color-bg)]/95 px-[var(--gutter)] backdrop-blur-sm";

/** Hero slide crossfade. 700ms — inside the 800ms ceiling. */
export const heroCrossfadeSlide = "transition-opacity duration-[700ms]";
