// Relative time for story-card meta rows.
//
// A news river reads by recency, and "3h ago" carries that where "August
// 21, 2026" does not. Past roughly a week the relative form stops being
// informative ("14d ago" is worse than a date), so it hands back to an
// absolute short date.
//
// Pure and timezone-explicit: the absolute fallback formats in the
// newsroom's zone, not the reader's, so a story does not appear to have
// been filed a day earlier for someone in California.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const RELATIVE_LIMIT = 7 * DAY;

export const TIME_ZONE = "America/New_York";

export function timeAgo(value: string | Date | null | undefined, now: Date = new Date()): string | null {
  if (!value) return null;
  const then = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(then.getTime())) return null;

  const elapsed = now.getTime() - then.getTime();

  // A publish timestamp a few seconds in the future is clock skew between
  // the database and the renderer, not a scheduled story — those are
  // filtered out of every public query upstream. Read it as "just now"
  // rather than printing a negative age.
  if (elapsed < MINUTE) return "Just now";

  if (elapsed < HOUR) {
    const m = Math.floor(elapsed / MINUTE);
    return `${m}m ago`;
  }
  if (elapsed < DAY) {
    const h = Math.floor(elapsed / HOUR);
    return `${h}h ago`;
  }
  if (elapsed < RELATIVE_LIMIT) {
    const d = Math.floor(elapsed / DAY);
    return `${d}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
    // Only show the year once it is genuinely a different one — "Aug 21"
    // is cleaner than "Aug 21, 2026" for anything filed this year.
    ...(then.getUTCFullYear() === now.getUTCFullYear() ? {} : { year: "numeric" }),
  }).format(then);
}
