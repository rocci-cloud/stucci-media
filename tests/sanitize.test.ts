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
