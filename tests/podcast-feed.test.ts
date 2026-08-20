import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePodcastFeed, FeedParseError, MAX_EPISODES_PER_FEED } from "../app/lib/podcast-feed";

// Podcast feeds are RSS 2.0 plus Apple's itunes: namespace, and publishers
// are inconsistent about which of the two carries any given value. These
// exercise the fallthroughs against a feed shaped like the real ones —
// third-party feeds can't be reached from CI, so this is the contract.

const feed = parsePodcastFeed(readFileSync("tests/fixtures/podcast-feed.xml", "utf8"));

describe("channel", () => {
  it("reads the show's identity", () => {
    expect(feed.title).toBe("The Rocci Stucci Show");
    expect(feed.author).toBe("Rocci Stucci");
    expect(feed.language).toBe("en-us");
    expect(feed.websiteUrl).toBe("https://example.com/show");
    expect(feed.isExplicit).toBe(false);
  });

  it("unwraps a CDATA description", () => {
    expect(feed.description).toContain("mainstream media won't run");
  });

  it("prefers itunes:image over the legacy <image><url>", () => {
    expect(feed.coverImageUrl).toBe("https://example.com/art.jpg");
  });

  it("collects every itunes:category", () => {
    expect(feed.categories).toEqual(["News", "Politics"]);
  });
});

describe("episodes", () => {
  it("orders newest first regardless of feed order", () => {
    expect(feed.episodes.map((e) => e.guid)).toEqual(["ep-143", "ep-142", "ep-141", "ep-evil"]);
  });

  it("reads a fully-specified episode", () => {
    const ep = feed.episodes.find((e) => e.guid === "ep-142")!;
    expect(ep.title).toBe("Episode 142: The Open Records Fight");
    expect(ep.audioUrl).toBe("https://example.com/audio/142.mp3");
    expect(ep.audioType).toBe("audio/mpeg");
    expect(ep.durationSeconds).toBe(52 * 60 + 10);
    expect(ep.episodeNumber).toBe(142);
    expect(ep.seasonNumber).toBe(4);
    expect(ep.imageUrl).toBe("https://example.com/ep142.jpg");
    expect(ep.episodeUrl).toBe("https://example.com/show/142");
    expect(ep.publishedAt?.toISOString()).toBe("2026-08-13T10:00:00.000Z");
  });

  it("accepts every spelling of itunes:duration", () => {
    const bySeconds = feed.episodes.find((e) => e.guid === "ep-143")!;
    const byHms = feed.episodes.find((e) => e.guid === "ep-141")!;
    expect(bySeconds.durationSeconds).toBe(3130);
    expect(byHms.durationSeconds).toBe(3723);
  });

  it("falls back from description to itunes:summary, and prefers content:encoded", () => {
    expect(feed.episodes.find((e) => e.guid === "ep-143")!.description).toBe("An hour on accountability.");
    expect(feed.episodes.find((e) => e.guid === "ep-141")!.description).toContain("Rich <strong>HTML</strong>");
  });

  it("finds audio in media:content when there is no enclosure", () => {
    expect(feed.episodes.find((e) => e.guid === "ep-141")!.audioUrl).toBe("https://example.com/audio/141.mp3");
  });

  it("reads per-episode explicit flags", () => {
    expect(feed.episodes.find((e) => e.guid === "ep-143")!.isExplicit).toBe(true);
    expect(feed.episodes.find((e) => e.guid === "ep-142")!.isExplicit).toBe(false);
  });

  it("refuses javascript: URLs from a third-party feed", () => {
    const evil = feed.episodes.find((e) => e.guid === "ep-evil")!;
    expect(evil.audioUrl).toBeNull();
    expect(evil.episodeUrl).toBeNull();
  });
});

describe("a feed with exactly one episode", () => {
  // fast-xml-parser returns a bare object rather than an array for a single
  // <item>, which would silently yield zero episodes without isArray config.
  const single = parsePodcastFeed(readFileSync("tests/fixtures/podcast-feed-single.xml", "utf8"));

  it("still parses that episode", () => {
    expect(single.episodes).toHaveLength(1);
    expect(single.episodes[0].title).toBe("The Only Episode");
  });

  it("falls back to itunes:summary for the show description", () => {
    expect(single.description).toBe("A show with exactly one episode.");
  });
});

describe("caps and ordering", () => {
  it(`keeps at most ${MAX_EPISODES_PER_FEED} episodes, dropping the oldest`, () => {
    const items = Array.from({ length: MAX_EPISODES_PER_FEED + 25 }, (_, i) => {
      const day = String((i % 28) + 1).padStart(2, "0");
      const year = 2020 + Math.floor(i / 28);
      return `<item><title>Ep ${i}</title><guid>g${i}</guid><pubDate>${year}-01-${day}T00:00:00Z</pubDate></item>`;
    }).join("");
    const big = parsePodcastFeed(`<rss><channel><title>Big</title>${items}</channel></rss>`);
    expect(big.episodes).toHaveLength(MAX_EPISODES_PER_FEED);
    const times = big.episodes.map((e) => e.publishedAt?.getTime() ?? 0);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe("bad input fails loudly", () => {
  it.each([
    ["not xml at all", "hello, world"],
    ["xml with no channel", "<rss><notachannel/></rss>"],
    ["a channel with no title", "<rss><channel><description>x</description></channel></rss>"],
  ])("%s", (_name, xml) => {
    expect(() => parsePodcastFeed(xml)).toThrow(FeedParseError);
  });

  it("skips an item with no title rather than failing the whole feed", () => {
    const partial = parsePodcastFeed(
      "<rss><channel><title>T</title><item><guid>a</guid></item><item><title>Good</title><guid>b</guid></item></channel></rss>"
    );
    expect(partial.episodes.map((e) => e.title)).toEqual(["Good"]);
  });
});
