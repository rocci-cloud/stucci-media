import { describe, expect, it } from "vitest";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { buildUrlset, escapeXml, siteUrl } from "../app/lib/sitemap-xml";

// The sitemap is hand-written XML rather than Next's metadata route (see the
// comment at the top of app/lib/sitemap-xml.ts), so the escaping and the
// lastmod handling are this project's problem now. A malformed <lastmod> or
// an unescaped ampersand invalidates the entire file at Google's end — the
// whole sitemap is rejected, not the one bad <url> — so these are the
// contract for the shape that goes over the wire.

const parser = new XMLParser({ ignoreAttributes: false, isArray: (name) => name === "url" });

function parse(xml: string) {
  expect(XMLValidator.validate(xml)).toBe(true);
  return parser.parse(xml).urlset;
}

describe("buildUrlset", () => {
  it("emits absolute URLs against the configured site origin", () => {
    const { url } = parse(buildUrlset([{ path: "/articles/hello" }]));
    expect(url[0].loc).toBe(`${siteUrl}/articles/hello`);
  });

  it("renders the homepage as the bare origin", () => {
    const { url } = parse(buildUrlset([{ path: "" }]));
    expect(url[0].loc).toBe(siteUrl);
  });

  it("carries changefreq and priority through when given", () => {
    const { url } = parse(
      buildUrlset([{ path: "/x", changeFrequency: "weekly", priority: 0.9 }]),
    );
    expect(url[0].changefreq).toBe("weekly");
    expect(url[0].priority).toBe(0.9);
  });

  it("omits optional elements rather than emitting empty ones", () => {
    const { url } = parse(buildUrlset([{ path: "/x" }]));
    expect(url[0]).not.toHaveProperty("lastmod");
    expect(url[0]).not.toHaveProperty("changefreq");
    expect(url[0]).not.toHaveProperty("priority");
  });

  it("normalises Date and ISO-string lastModified to W3C datetime", () => {
    const iso = "2026-07-10T13:14:49.000Z";
    const fromDate = parse(buildUrlset([{ path: "/a", lastModified: new Date(iso) }]));
    const fromString = parse(buildUrlset([{ path: "/a", lastModified: iso }]));
    expect(fromDate.url[0].lastmod).toBe(iso);
    expect(fromString.url[0].lastmod).toBe(iso);
  });

  // A null publishedAt is normal (drafts promoted without a date) and an
  // unparseable one has been seen from feed imports; both must drop the
  // element instead of writing "Invalid Date" into valid-looking XML.
  it("drops lastmod it cannot parse instead of emitting garbage", () => {
    for (const bad of [null, undefined, "", "not a date"]) {
      const { url } = parse(buildUrlset([{ path: "/a", lastModified: bad }]));
      expect(url[0]).not.toHaveProperty("lastmod");
    }
  });

  it("escapes XML metacharacters in a path", () => {
    const xml = buildUrlset([{ path: "/tag/rock%20&%20roll" }]);
    expect(xml).toContain("&amp;");
    expect(XMLValidator.validate(xml)).toBe(true);
    expect(parse(xml).url[0].loc).toBe(`${siteUrl}/tag/rock%20&%20roll`);
  });

  it("stays valid across a full-size archive", () => {
    const entries = Array.from({ length: 900 }, (_, i) => ({
      path: `/podcasts/show/episode-${i}`,
      lastModified: new Date(Date.UTC(2026, 0, 1 + (i % 300))),
      priority: 0.4,
    }));
    const { url } = parse(buildUrlset(entries));
    expect(url).toHaveLength(900);
  });
});

describe("escapeXml", () => {
  it("escapes all five XML entities", () => {
    expect(escapeXml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&apos;");
  });
});
