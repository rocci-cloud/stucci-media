/**
 * Pure classification helpers for the analytics collector.
 *
 * Deliberately dependency-free and side-effect-free: every function here is
 * a plain input/output transform, so the whole traffic-attribution contract
 * can be covered by unit tests rather than only being observable once real
 * traffic has already been misfiled. No user-agent parsing library — the
 * three buckets this site actually reports on (device / browser / OS) are
 * cheap to derive, and a dependency that ships a megabyte of regexes to
 * answer "is this a phone" is a bad trade.
 */

export type Device = "mobile" | "tablet" | "desktop";
export type TrafficSource = "direct" | "search" | "social" | "referral" | "internal";
export type PageType = "article" | "home" | "category" | "podcast" | "tag" | "search" | "other";

/**
 * Crawlers, previewers, and uptime checks.
 *
 * This is the single biggest accuracy problem with the view counter that
 * existed before this table: it incremented on every render, so every
 * Googlebot crawl and every Facebook link-preview scrape counted as a
 * reader. Anything matching here is dropped at the collector and never
 * reaches the database.
 *
 * Erring toward over-matching is correct. Undercounting real people is a
 * dull number; counting bots as an audience is a number that lies.
 */
const BOT_PATTERN =
  /bot|crawler|spider|crawling|slurp|mediapartners|facebookexternalhit|facebot|whatsapp|telegram|discord|slackbot|twitterbot|linkedinbot|pinterest|embedly|quora|redditbot|applebot|petalbot|bingpreview|yandex|duckduckbot|baiduspider|semrush|ahrefs|mj12|dotbot|screaming frog|lighthouse|chrome-lighthouse|pagespeed|gtmetrix|headlesschrome|phantomjs|puppeteer|playwright|selenium|curl\/|wget\/|python-requests|go-http-client|axios\/|node-fetch|okhttp|java\/|libwww|scrapy|feedfetcher|feedly|rss|monitor|uptime|pingdom|statuscake|newrelic|datadog|checkly|vercel-screenshot|prerender|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic-ai|perplexitybot|ccbot|bytespider|amazonbot|google-extended|meta-externalagent/i;

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // A real browser always sends one.
  return BOT_PATTERN.test(userAgent);
}

/**
 * Search engines, by referrer hostname. Matched as a suffix against the
 * registrable-ish domain so every Google country domain (google.co.uk,
 * google.de) lands in the same bucket without enumerating them.
 */
const SEARCH_HOSTS = [
  "google.", "bing.", "duckduckgo.", "yahoo.", "yandex.", "baidu.", "ecosia.",
  "brave.", "startpage.", "search.marcia", "qwant.", "searx", "ask.com",
  "aol.", "lycos.", "naver.", "seznam.", "perplexity.", "chatgpt.com", "openai.com",
];

const SOCIAL_HOSTS = [
  "facebook.", "fb.", "m.facebook.", "l.facebook.", "instagram.", "twitter.",
  "x.com", "t.co", "linkedin.", "lnkd.in", "reddit.", "youtube.", "youtu.be",
  "pinterest.", "tiktok.", "threads.", "truthsocial.", "gettr.", "rumble.",
  "telegram.", "t.me", "whatsapp.", "wa.me", "discord.", "mastodon", "bsky.",
  "substack.", "tumblr.", "vk.com", "snapchat.", "nextdoor.",
];

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function matchesAny(host: string, needles: string[]): boolean {
  return needles.some((n) => host === n.replace(/\.$/, "") || host.startsWith(n) || host.includes(`.${n}`));
}

/**
 * Bucket a referrer into the five groups the dashboard reports on.
 *
 * `siteHost` is this site's own hostname: traffic from our own pages is
 * "internal" and is deliberately kept separate from "direct" so that
 * someone clicking through from the homepage to an article does not get
 * counted as a fresh arrival from nowhere.
 */
export function classifyReferrer(
  referrer: string | null | undefined,
  siteHost: string,
): { source: TrafficSource; referrerDomain: string | null } {
  if (!referrer || !referrer.trim()) return { source: "direct", referrerDomain: null };

  const host = hostOf(referrer);
  if (!host) return { source: "direct", referrerDomain: null };

  const ownHost = siteHost.toLowerCase().replace(/^www\./, "");
  if (host === ownHost) return { source: "internal", referrerDomain: host };

  if (matchesAny(host, SEARCH_HOSTS)) return { source: "search", referrerDomain: host };
  if (matchesAny(host, SOCIAL_HOSTS)) return { source: "social", referrerDomain: host };
  return { source: "referral", referrerDomain: host };
}

/**
 * A UTM medium, when present, overrides referrer-derived attribution:
 * a link the site tagged itself knows more about where it was placed than
 * the browser's Referer header does (and paid/email traffic frequently
 * arrives with no referrer at all, which would otherwise read as "direct").
 */
export function applyUtmOverride(
  source: TrafficSource,
  utmMedium: string | null | undefined,
  utmSource: string | null | undefined,
): TrafficSource {
  const medium = (utmMedium ?? "").toLowerCase();
  if (!medium) return source;
  if (/cpc|ppc|paid|display|banner|cpm/.test(medium)) return "referral";
  if (/social|facebook|instagram|twitter/.test(medium)) return "social";
  if (/organic|search/.test(medium)) return "search";
  if (/email|newsletter/.test(medium)) return "referral";
  // An unrecognised medium still means the link was tagged, so it is not
  // "direct" even when the browser sent no referrer.
  return source === "direct" && utmSource ? "referral" : source;
}

export function parseUserAgent(ua: string): { device: Device; browser: string; os: string } {
  const s = ua.toLowerCase();

  // Order matters: iPad reports "mobile" in some modes, and Android tablets
  // are identified by the *absence* of "mobile" rather than its presence.
  let device: Device = "desktop";
  if (/ipad|tablet|playbook|silk|kindle/.test(s) || (/android/.test(s) && !/mobile/.test(s))) {
    device = "tablet";
  } else if (/mobi|iphone|ipod|android|windows phone|blackberry|iemobile|opera mini/.test(s)) {
    device = "mobile";
  }

  // Chromium derivatives all contain "chrome", so the specific ones have to
  // be ruled out before falling back to Chrome itself. Same for Safari,
  // which every Chromium UA also claims.
  let browser = "Other";
  if (/edg\//.test(s)) browser = "Edge";
  else if (/opr\/|opera/.test(s)) browser = "Opera";
  else if (/samsungbrowser/.test(s)) browser = "Samsung Internet";
  else if (/firefox|fxios/.test(s)) browser = "Firefox";
  else if (/crios/.test(s)) browser = "Chrome";
  else if (/chrome|chromium/.test(s)) browser = "Chrome";
  else if (/safari/.test(s)) browser = "Safari";

  let os = "Other";
  if (/windows/.test(s)) os = "Windows";
  else if (/iphone|ipad|ipod|ios/.test(s)) os = "iOS";
  else if (/mac os x|macintosh/.test(s)) os = "macOS";
  else if (/android/.test(s)) os = "Android";
  else if (/cros/.test(s)) os = "ChromeOS";
  else if (/linux/.test(s)) os = "Linux";

  return { device, browser, os };
}

/** Which kind of page a path is, for grouping in the dashboard. */
export function pageTypeFor(path: string): PageType {
  const p = path.split("?")[0].replace(/\/+$/, "") || "/";
  if (p === "/") return "home";
  if (p.startsWith("/articles/")) return "article";
  if (p.startsWith("/category/")) return "category";
  if (p.startsWith("/podcasts")) return "podcast";
  if (p.startsWith("/tag/")) return "tag";
  if (p.startsWith("/search")) return "search";
  return "other";
}

/**
 * Normalise a path before storing it: strip the query string, drop a
 * trailing slash, and cap the length. Without this, the same page arrives
 * as a dozen distinct rows once UTM parameters are in play, and "top pages"
 * turns into a list of the same article over and over.
 */
export function normalizePath(raw: string): string {
  const noQuery = raw.split("?")[0].split("#")[0];
  const trimmed = noQuery.replace(/\/+$/, "");
  const path = trimmed === "" ? "/" : trimmed;
  return path.slice(0, 512);
}

/** The article slug in an article path, or null for any other page. */
export function articleSlugFromPath(path: string): string | null {
  const m = normalizePath(path).match(/^\/articles\/([^/]+)$/);
  return m ? m[1] : null;
}

/**
 * Reject nonsense before it reaches the database. The collector is a public
 * endpoint, so everything it stores is attacker-controlled until checked.
 */
export function isPlausibleDuration(ms: unknown): ms is number {
  // Four hours. Longer than that is a tab left open overnight, not a read,
  // and letting it through would wreck every average it lands in.
  return typeof ms === "number" && Number.isFinite(ms) && ms >= 0 && ms <= 4 * 60 * 60 * 1000;
}

export function isPlausibleScrollPct(pct: unknown): pct is number {
  return typeof pct === "number" && Number.isFinite(pct) && pct >= 0 && pct <= 100;
}

/** "3m 24s" / "48s" — used everywhere a duration is shown. */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/**
 * The day window a dashboard period covers.
 *
 * Kept here, in the Prisma-free module, for two reasons. It is pure, so it
 * can be tested without a database; and both the headline totals and the
 * chart derive their range from this one function, so the two cannot
 * disagree about what "last 7 days" means.
 *
 * That disagreement was a real bug: the window used to start at "now minus
 * N x 24h", a mid-day timestamp, while the chart only drew the last N whole
 * calendar days. Views from the oldest, partial day were counted in the
 * headline and dropped from the chart, so the bars never summed to the
 * number printed above them. Windows are now aligned to UTC day boundaries,
 * matching the day the rows are grouped by, so the totals reconcile.
 *
 * `days` counts today as one of them: days=7 is today plus the previous six.
 */
export function analyticsWindow(
  days: number,
  now: Date = new Date(),
): { from: Date; previousFrom: Date; buckets: string[] } {
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayMs = 24 * 60 * 60 * 1000;

  const from = new Date(startOfToday - (days - 1) * dayMs);
  // The equally-sized window immediately before, so period-over-period
  // deltas compare like with like.
  const previousFrom = new Date(startOfToday - (2 * days - 1) * dayMs);

  const buckets: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    buckets.push(new Date(startOfToday - i * dayMs).toISOString().slice(0, 10));
  }

  return { from, previousFrom, buckets };
}
