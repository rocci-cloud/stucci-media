import { XMLParser } from "fast-xml-parser";
import { parseDuration } from "./podcast-duration";

/**
 * Podcast RSS parsing.
 *
 * Podcast feeds are RSS 2.0 plus Apple's `itunes:` namespace, and in
 * practice publishers are inconsistent about which of the two carries a
 * given value — description vs. itunes:summary, the channel <image><url>
 * vs. itunes:image@href, and so on. Every getter below falls through the
 * realistic alternatives rather than trusting one spelling, because a
 * feed that half-parses looks worse than one that fails outright.
 *
 * Kept free of any Prisma import so it stays unit-testable on its own and
 * can't drag the database client anywhere it doesn't belong.
 */

export type ParsedFeedEpisode = {
  guid: string;
  title: string;
  description: string;
  audioUrl: string | null;
  audioType: string | null;
  durationSeconds: number | null;
  imageUrl: string | null;
  episodeUrl: string | null;
  episodeNumber: number | null;
  seasonNumber: number | null;
  isExplicit: boolean;
  publishedAt: Date | null;
};

export type ParsedFeed = {
  title: string;
  description: string;
  coverImageUrl: string | null;
  author: string | null;
  websiteUrl: string | null;
  language: string | null;
  isExplicit: boolean;
  categories: string[];
  episodes: ParsedFeedEpisode[];
};

export class FeedParseError extends Error {}

/** How many episodes we keep per show. Newest first; the tail is dropped. */
export const MAX_EPISODES_PER_FEED = 100;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Text content of a tag that also has attributes lands here.
  textNodeName: "#text",
  trimValues: true,
  // Feeds routinely wrap descriptions in CDATA containing real HTML; the
  // parser must not try to interpret that as markup.
  cdataPropName: "#cdata",
  // A show with exactly one episode would otherwise parse <item> as an
  // object rather than an array, silently breaking the episode loop.
  isArray: (name) => name === "item" || name === "itunes:category",
});

/**
 * Pulls usable text out of a node that might be a plain string, a number,
 * a CDATA wrapper, or a tag-with-attributes whose text is in #text.
 */
function text(node: unknown): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node.trim();
  if (typeof node === "number" || typeof node === "boolean") return String(node);
  if (Array.isArray(node)) return text(node[0]);
  if (typeof node === "object") {
    const record = node as Record<string, unknown>;
    if ("#cdata" in record) return text(record["#cdata"]);
    if ("#text" in record) return text(record["#text"]);
  }
  return "";
}

/** First non-empty value among several possible spellings of the same field. */
function firstText(...nodes: unknown[]): string {
  for (const node of nodes) {
    const value = text(node);
    if (value) return value;
  }
  return "";
}

function attr(node: unknown, name: string): string {
  if (!node || typeof node !== "object") return "";
  if (Array.isArray(node)) return attr(node[0], name);
  const value = (node as Record<string, unknown>)[`@_${name}`];
  return value === undefined || value === null ? "" : String(value).trim();
}

function toInt(value: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/** Only http(s) — a feed shouldn't be able to inject javascript: or data: URLs. */
function safeUrl(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function toDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Apple's explicit flag has been spelled several ways over the years. */
function isExplicitValue(value: string): boolean {
  const v = value.toLowerCase();
  return v === "yes" || v === "true" || v === "explicit";
}

function parseEpisode(item: Record<string, unknown>): ParsedFeedEpisode | null {
  const title = firstText(item.title, item["itunes:title"]);
  const enclosure = item.enclosure;

  const audioUrl =
    safeUrl(attr(enclosure, "url")) ??
    // Some feeds (notably video-first shows syndicating audio) put the
    // media in a media:content instead of an enclosure.
    safeUrl(attr(item["media:content"], "url"));

  // A guid is technically optional in RSS. Falling back to the audio URL
  // then the title keeps the per-show unique key stable across refreshes
  // for feeds that omit it, which is what actually matters here.
  const guid = firstText(item.guid) || audioUrl || title;
  if (!guid || !title) return null;

  const rawDuration = firstText(item["itunes:duration"]);

  return {
    guid: guid.slice(0, 500),
    title: title.slice(0, 300),
    description: firstText(item["content:encoded"], item.description, item["itunes:summary"]).slice(0, 10_000),
    audioUrl,
    audioType: attr(enclosure, "type") || null,
    // itunes:duration is either "1:02:03" / "48:10" or a bare seconds
    // count — parseDuration already handles all three.
    durationSeconds: parseDuration(rawDuration),
    imageUrl: safeUrl(attr(item["itunes:image"], "href")),
    episodeUrl: safeUrl(firstText(item.link)),
    episodeNumber: toInt(firstText(item["itunes:episode"])),
    seasonNumber: toInt(firstText(item["itunes:season"])),
    isExplicit: isExplicitValue(firstText(item["itunes:explicit"])),
    publishedAt: toDate(firstText(item.pubDate, item["dc:date"])),
  };
}

export function parsePodcastFeed(xml: string): ParsedFeed {
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    throw new FeedParseError("That doesn't look like valid XML.");
  }

  const rss = doc.rss as Record<string, unknown> | undefined;
  const channel = (rss?.channel ?? doc.channel) as Record<string, unknown> | undefined;
  if (!channel) {
    throw new FeedParseError("No RSS channel found — is this actually a podcast feed?");
  }

  const title = firstText(channel.title, channel["itunes:title"]);
  if (!title) {
    throw new FeedParseError("This feed has no title, so it can't be a valid podcast feed.");
  }

  const items = (channel.item as Record<string, unknown>[] | undefined) ?? [];
  const episodes = items
    .map(parseEpisode)
    .filter((e): e is ParsedFeedEpisode => e !== null)
    // Newest first, so the MAX cap below drops the oldest rather than
    // whatever order the publisher happened to emit.
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, MAX_EPISODES_PER_FEED);

  const categories = ((channel["itunes:category"] as unknown[] | undefined) ?? [])
    .map((c) => attr(c, "text"))
    .filter(Boolean)
    .slice(0, 8);

  return {
    title: title.slice(0, 200),
    description: firstText(channel.description, channel["itunes:summary"], channel["itunes:subtitle"]).slice(0, 5_000),
    coverImageUrl:
      safeUrl(attr(channel["itunes:image"], "href")) ??
      safeUrl(firstText((channel.image as Record<string, unknown> | undefined)?.url)),
    author: firstText(channel["itunes:author"], channel.managingEditor).slice(0, 200) || null,
    websiteUrl: safeUrl(firstText(channel.link)),
    language: firstText(channel.language).slice(0, 20) || null,
    isExplicit: isExplicitValue(firstText(channel["itunes:explicit"])),
    categories,
    episodes,
  };
}

const FETCH_TIMEOUT_MS = 15_000;
const MAX_FEED_BYTES = 10 * 1024 * 1024;

/**
 * Fetches and parses a feed. Bounded on both time and size: a feed URL is
 * operator-supplied but points at a third-party server, and neither a
 * hung connection nor a multi-hundred-megabyte response should be able to
 * take down the request handling it.
 */
export async function fetchPodcastFeed(feedUrl: string): Promise<ParsedFeed> {
  const url = safeUrl(feedUrl);
  if (!url) {
    throw new FeedParseError("Enter a valid http:// or https:// feed URL.");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        // Some hosts serve a bot-blocking page to an unidentified client.
        "user-agent": "StucciMedia-PodcastBot/1.0 (+https://www.stuccimedia.com)",
        accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new FeedParseError("That feed took too long to respond.");
    }
    throw new FeedParseError("Couldn't reach that feed URL.");
  }

  if (!response.ok) {
    throw new FeedParseError(`That feed returned ${response.status}.`);
  }

  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_FEED_BYTES) {
    throw new FeedParseError("That feed is too large to import.");
  }

  const xml = await response.text();
  // Re-checked after reading: content-length is advisory and often absent
  // on chunked responses, so the header check above can't be the only bound.
  if (xml.length > MAX_FEED_BYTES) {
    throw new FeedParseError("That feed is too large to import.");
  }

  return parsePodcastFeed(xml);
}
