import { describe, expect, it } from "vitest";
import { sanitizeArticleHtml, bodyInputToHtml } from "../app/lib/sanitize";

// The sanitizer and the editor toolbar are two halves of one contract: every
// tag a toolbar button can produce has to survive a save, and everything else
// has to be stripped. Both directions matter — a too-strict allowlist means
// editors silently lose formatting, a too-loose one is stored XSS.

describe("what must survive a save", () => {
  it.each([
    ["paragraphs", "<p>Body copy.</p>"],
    ["headings", "<h2>Section</h2><h3>Sub</h3><h4>Minor</h4>"],
    ["bold and italic", "<p><strong>bold</strong> and <em>italic</em></p>"],
    ["lists", "<ul><li>One</li></ul><ol><li>First</li></ol>"],
    ["blockquotes", "<blockquote><p>Quoted.</p></blockquote>"],
    ["tables", "<table><tbody><tr><td>Cell</td></tr></tbody></table>"],
    ["code blocks", "<pre><code>const x = 1;</code></pre>"],
  ])("keeps %s", (_name, html) => {
    const out = sanitizeArticleHtml(html);
    const firstTag = html.match(/<(\w+)/)?.[1];
    expect(out).toContain(`<${firstTag}`);
  });

  it("keeps images with their src and alt", () => {
    const out = sanitizeArticleHtml('<img src="https://example.com/a.jpg" alt="A caption">');
    expect(out).toContain("https://example.com/a.jpg");
    expect(out).toContain('alt="A caption"');
  });

  it("keeps links and their href", () => {
    const out = sanitizeArticleHtml('<p><a href="https://example.com">read</a></p>');
    expect(out).toContain('href="https://example.com"');
  });
});

describe("what must never survive a save", () => {
  it("strips script tags and their contents", () => {
    const out = sanitizeArticleHtml('<p>Fine.</p><script>alert("xss")</script>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(");
    expect(out).toContain("Fine.");
  });

  it("strips inline event handlers", () => {
    const out = sanitizeArticleHtml('<p onclick="steal()">Text</p>');
    expect(out).not.toContain("onclick");
    expect(out).toContain("Text");
  });

  it("strips javascript: hrefs", () => {
    const out = sanitizeArticleHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
  });

  it("strips iframes from hosts that aren't on the embed allowlist", () => {
    const out = sanitizeArticleHtml('<iframe src="https://evil.example/embed"></iframe>');
    expect(out).not.toContain("evil.example");
  });
});

describe("plain-text authoring still works", () => {
  it("wraps blank-line-separated text in paragraphs", () => {
    const out = bodyInputToHtml("First para.\n\nSecond para.");
    expect(out).toContain("<p>First para.</p>");
    expect(out).toContain("<p>Second para.</p>");
  });

  it("leaves real HTML alone rather than double-wrapping it", () => {
    const out = bodyInputToHtml("<h2>Heading</h2><p>Body.</p>");
    expect(out).toContain("<h2>Heading</h2>");
    expect(out).not.toContain("<p><h2>");
  });
});

describe("elements left empty by sanitising", () => {
  it("drops an iframe whose disallowed src was stripped, not just its src", () => {
    // An <iframe> with no src still paints a ~150px empty box, which is very
    // visible in third-party podcast show notes.
    const out = sanitizeArticleHtml('<p>Notes.</p><iframe src="https://evil.example/x"></iframe>');
    expect(out).not.toContain("<iframe");
    expect(out).toContain("Notes.");
  });

  it("keeps an iframe from an allowlisted host", () => {
    const out = sanitizeArticleHtml('<iframe src="https://www.youtube.com/embed/abc123"></iframe>');
    expect(out).toContain("<iframe");
    expect(out).toContain("youtube.com/embed/abc123");
  });

  it("drops an image whose src was stripped", () => {
    const out = sanitizeArticleHtml('<p>Text.</p><img src="javascript:alert(1)">');
    expect(out).not.toContain("<img");
    expect(out).toContain("Text.");
  });

  it("keeps a normal image", () => {
    const out = sanitizeArticleHtml('<img src="https://example.com/a.jpg" alt="A">');
    expect(out).toContain("https://example.com/a.jpg");
  });
});

// Outbound citations and in-site navigation are not the same kind of link.
// A blanket nofollow + target="_blank" on every anchor is right for the
// former and actively harmful for the latter: it throws away internal link
// equity on every article an editor writes, and kicks readers into a new
// tab to move around our own site.
describe("link rel/target treatment", () => {
  it("marks an outbound link nofollow and opens it in a new tab", () => {
    const out = sanitizeArticleHtml('<p><a href="https://example.com/study">A study</a></p>');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });

  it.each([
    ["a root-relative path", '<a href="/category/political-news">Politics</a>'],
    ["an in-page fragment", '<a href="#sources">Sources</a>'],
    ["a bare query string", '<a href="?page=2">Next</a>'],
    ["an absolute URL on our own host", '<a href="https://www.stuccimedia.com/about">About</a>'],
    ["our apex domain", '<a href="https://stuccimedia.com/about">About</a>'],
  ])("leaves %s clean", (_name, html) => {
    const out = sanitizeArticleHtml(html);
    expect(out).not.toContain("nofollow");
    expect(out).not.toContain('target="_blank"');
  });

  it("treats a protocol-relative URL as outbound despite the leading slash", () => {
    const out = sanitizeArticleHtml('<a href="//evil.example.com/x">Click</a>');
    expect(out).toContain("nofollow");
  });

  it("treats a lookalike hostname as outbound", () => {
    const out = sanitizeArticleHtml('<a href="https://stuccimedia.com.evil.example/x">Click</a>');
    expect(out).toContain("nofollow");
  });

  it("merges an author's rel with the required outbound tokens rather than dropping either", () => {
    const out = sanitizeArticleHtml('<a href="https://example.com" rel="sponsored">Ad</a>');
    expect(out).toContain("sponsored");
    expect(out).toContain("nofollow");
  });

  it("never lets an outbound link escape nofollow by pre-setting rel", () => {
    const out = sanitizeArticleHtml('<a href="https://example.com" rel="noopener noreferrer">Cite</a>');
    expect(out).toContain("nofollow");
  });

  it("does not duplicate rel tokens already present", () => {
    const out = sanitizeArticleHtml('<a href="https://example.com" rel="nofollow">Cite</a>');
    expect(out.match(/nofollow/g)).toHaveLength(1);
  });

  it("still keeps the href on both kinds of link", () => {
    const out = sanitizeArticleHtml('<a href="/about">In</a><a href="https://example.com">Out</a>');
    expect(out).toContain('href="/about"');
    expect(out).toContain('href="https://example.com"');
  });
});
