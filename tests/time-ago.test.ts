import { describe, expect, it } from "vitest";
import { timeAgo } from "../app/lib/time-ago";

// The meta row on every story card runs through this, so a wrong branch
// here is wrong on every card on the homepage at once.
const NOW = new Date("2026-08-29T17:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("timeAgo", () => {
  it("collapses anything under a minute to 'Just now'", () => {
    expect(timeAgo(ago(0), NOW)).toBe("Just now");
    expect(timeAgo(ago(59_000), NOW)).toBe("Just now");
  });

  it("counts minutes, then hours, then days", () => {
    expect(timeAgo(ago(MINUTE), NOW)).toBe("1m ago");
    expect(timeAgo(ago(59 * MINUTE), NOW)).toBe("59m ago");
    expect(timeAgo(ago(HOUR), NOW)).toBe("1h ago");
    expect(timeAgo(ago(23 * HOUR), NOW)).toBe("23h ago");
    expect(timeAgo(ago(DAY), NOW)).toBe("1d ago");
    expect(timeAgo(ago(6 * DAY), NOW)).toBe("6d ago");
  });

  // "14d ago" is less useful than a date, which is where the cutover is.
  it("hands back to a short date past a week", () => {
    expect(timeAgo(ago(7 * DAY), NOW)).toBe("Aug 22");
    expect(timeAgo(ago(60 * DAY), NOW)).toBe("Jun 30");
  });

  it("adds the year only when it is a different one", () => {
    expect(timeAgo("2026-01-05T12:00:00Z", NOW)).toBe("Jan 5");
    expect(timeAgo("2025-11-17T12:00:00Z", NOW)).toBe("Nov 17, 2025");
  });

  // Clock skew between the database and the renderer, not a scheduled
  // story — those never reach a public query. Must not print a negative age.
  it("reads a slightly future timestamp as 'Just now'", () => {
    expect(timeAgo(new Date(NOW.getTime() + 30_000).toISOString(), NOW)).toBe("Just now");
  });

  it("returns null for anything it cannot read, so the card omits the slot", () => {
    for (const bad of [null, undefined, "", "not a date"]) {
      expect(timeAgo(bad, NOW)).toBeNull();
    }
  });
});
