import { describe, expect, it } from "vitest";
import {
  applyUtmOverride,
  articleSlugFromPath,
  classifyReferrer,
  formatDuration,
  isBot,
  isPlausibleDuration,
  isPlausibleScrollPct,
  normalizePath,
  pageTypeFor,
  parseUserAgent,
} from "../app/lib/analytics-classify";

const SITE = "www.stuccimedia.com";

// Counting a crawler as a reader is the failure mode that made the old
// viewCount column untrustworthy, so this is the most important check here.
describe("bot detection", () => {
  it.each([
    ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
    ["Facebook link preview", "facebookexternalhit/1.1"],
    ["Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0)"],
    ["Twitterbot", "Twitterbot/1.0"],
    ["Slack unfurl", "Slackbot-LinkExpanding 1.0"],
    ["curl", "curl/8.4.0"],
    ["headless Chrome", "Mozilla/5.0 HeadlessChrome/120.0.0.0"],
    ["Playwright", "Mozilla/5.0 playwright/1.40"],
    ["an AI crawler", "Mozilla/5.0 (compatible; GPTBot/1.0)"],
    ["an uptime monitor", "Pingdom.com_bot_version_1.4"],
  ])("flags %s", (_name, ua) => {
    expect(isBot(ua)).toBe(true);
  });

  it.each([
    ["Chrome on Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"],
    ["Safari on iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"],
    ["Firefox on Mac", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0"],
  ])("lets %s through", (_name, ua) => {
    expect(isBot(ua)).toBe(false);
  });

  it("treats a missing user agent as a bot", () => {
    expect(isBot(null)).toBe(true);
    expect(isBot("")).toBe(true);
  });
});

describe("referrer attribution", () => {
  it("treats no referrer as direct", () => {
    expect(classifyReferrer(null, SITE).source).toBe("direct");
    expect(classifyReferrer("", SITE).source).toBe("direct");
  });

  it.each([
    ["https://www.google.com/", "search"],
    ["https://google.co.uk/search?q=x", "search"],
    ["https://duckduckgo.com/", "search"],
    ["https://www.bing.com/", "search"],
    ["https://www.perplexity.ai/", "search"],
  ])("files %s as %s", (url, expected) => {
    expect(classifyReferrer(url, SITE).source).toBe(expected);
  });

  it.each([
    ["https://www.facebook.com/", "social"],
    ["https://l.facebook.com/l.php", "social"],
    ["https://t.co/abc123", "social"],
    ["https://x.com/someone/status/1", "social"],
    ["https://www.reddit.com/r/news/", "social"],
    ["https://rumble.com/v1", "social"],
  ])("files %s as %s", (url, expected) => {
    expect(classifyReferrer(url, SITE).source).toBe(expected);
  });

  it("files an unknown site as referral and keeps the domain", () => {
    const r = classifyReferrer("https://someblog.example/post", SITE);
    expect(r.source).toBe("referral");
    expect(r.referrerDomain).toBe("someblog.example");
  });

  // Internal clicks are the difference between "500 people arrived" and
  // "150 people arrived and clicked around", so they get their own bucket.
  it("separates our own pages from direct arrivals", () => {
    expect(classifyReferrer("https://www.stuccimedia.com/", SITE).source).toBe("internal");
    expect(classifyReferrer("https://stuccimedia.com/category/veterans", SITE).source).toBe("internal");
  });

  it("strips www when reporting the domain", () => {
    expect(classifyReferrer("https://www.facebook.com/x", SITE).referrerDomain).toBe("facebook.com");
  });

  it("falls back to direct on an unparseable referrer", () => {
    expect(classifyReferrer("not a url", SITE).source).toBe("direct");
  });
});

describe("utm override", () => {
  it("keeps referrer attribution when no medium is tagged", () => {
    expect(applyUtmOverride("search", null, null)).toBe("search");
  });

  it("reclassifies a tagged social link that arrived with no referrer", () => {
    expect(applyUtmOverride("direct", "social", "facebook")).toBe("social");
  });

  it("treats paid mediums as referral", () => {
    expect(applyUtmOverride("direct", "cpc", "google")).toBe("referral");
  });

  it("stops a tagged link from being reported as direct", () => {
    expect(applyUtmOverride("direct", "newsletter", "weekly")).toBe("referral");
  });
});

describe("user agent parsing", () => {
  it("reads an iPhone as mobile Safari on iOS", () => {
    const r = parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1");
    expect(r).toEqual({ device: "mobile", browser: "Safari", os: "iOS" });
  });

  it("reads a Windows desktop as Chrome on Windows", () => {
    const r = parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    expect(r).toEqual({ device: "desktop", browser: "Chrome", os: "Windows" });
  });

  // Every Chromium UA also claims Safari, and Edge also claims Chrome, so
  // these two are the ones a naive substring check gets wrong.
  it("does not mistake Edge for Chrome", () => {
    expect(parseUserAgent("Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36 Edg/120.0").browser).toBe("Edge");
  });

  it("does not mistake Chrome for Safari", () => {
    expect(parseUserAgent("Mozilla/5.0 (Macintosh) Chrome/120 Safari/537.36").browser).toBe("Chrome");
  });

  it("reads an iPad as a tablet", () => {
    expect(parseUserAgent("Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) Safari/604.1").device).toBe("tablet");
  });

  // An Android tablet is identified by the absence of "mobile", not its
  // presence, which is the opposite of how phones are detected.
  it("reads an Android tablet as a tablet, and an Android phone as mobile", () => {
    expect(parseUserAgent("Mozilla/5.0 (Linux; Android 13; SM-X700) Chrome/120 Safari/537.36").device).toBe("tablet");
    expect(parseUserAgent("Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/120 Mobile Safari/537.36").device).toBe("mobile");
  });
});

describe("page typing and path normalisation", () => {
  it.each([
    ["/", "home"],
    ["/articles/some-slug", "article"],
    ["/category/veterans", "category"],
    ["/podcasts", "podcast"],
    ["/tag/freedom", "tag"],
    ["/search", "search"],
    ["/subscribe", "other"],
  ])("types %s as %s", (path, expected) => {
    expect(pageTypeFor(path)).toBe(expected);
  });

  // Without this the same article shows up as many separate rows in "top
  // pages" the moment anything is shared with a UTM tag on it.
  it("collapses query strings, fragments and trailing slashes", () => {
    expect(normalizePath("/articles/x?utm_source=facebook")).toBe("/articles/x");
    expect(normalizePath("/articles/x#comments")).toBe("/articles/x");
    expect(normalizePath("/category/veterans/")).toBe("/category/veterans");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("")).toBe("/");
  });

  it("extracts an article slug only from a real article path", () => {
    expect(articleSlugFromPath("/articles/the-illusion-of-freedom?x=1")).toBe("the-illusion-of-freedom");
    expect(articleSlugFromPath("/category/veterans")).toBeNull();
    expect(articleSlugFromPath("/articles/a/b")).toBeNull();
  });
});

// The collector is a public endpoint, so anything it stores is
// attacker-controlled until it has been range-checked.
describe("payload validation", () => {
  it("accepts a realistic read time and rejects nonsense", () => {
    expect(isPlausibleDuration(45_000)).toBe(true);
    expect(isPlausibleDuration(0)).toBe(true);
    expect(isPlausibleDuration(-1)).toBe(false);
    expect(isPlausibleDuration(Number.MAX_SAFE_INTEGER)).toBe(false);
    expect(isPlausibleDuration(NaN)).toBe(false);
    expect(isPlausibleDuration("60000")).toBe(false);
  });

  it("caps a tab left open overnight rather than averaging it in", () => {
    expect(isPlausibleDuration(4 * 60 * 60 * 1000)).toBe(true);
    expect(isPlausibleDuration(4 * 60 * 60 * 1000 + 1)).toBe(false);
  });

  it("bounds scroll depth to a percentage", () => {
    expect(isPlausibleScrollPct(0)).toBe(true);
    expect(isPlausibleScrollPct(100)).toBe(true);
    expect(isPlausibleScrollPct(101)).toBe(false);
    expect(isPlausibleScrollPct(-5)).toBe(false);
  });
});

describe("duration formatting", () => {
  it.each([
    [0, "0s"],
    [45_000, "45s"],
    [204_000, "3m 24s"],
    [3_600_000, "1h 0m"],
  ])("formats %ims as %s", (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });

  // Null is "nobody's beacon came back", which is different from zero.
  it("renders a missing duration as a dash, not zero", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(undefined)).toBe("—");
  });
});
