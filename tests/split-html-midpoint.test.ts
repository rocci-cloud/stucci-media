import { describe, expect, it } from "vitest";
import { splitHtmlAtMidpoint } from "../app/lib/split-html-midpoint";

// Backs the mid-article banner slot. The two halves are rendered with
// dangerouslySetInnerHTML, so a split inside a tag or mid-list would produce
// broken markup on a live article page.

const doc = [
  "<p>First paragraph with <strong>bold</strong> and a <a href=\"https://example.com\">link</a>.</p>",
  "<h2>A heading</h2>",
  "<p>Second paragraph.</p>",
  "<ul><li>One</li><li>Two</li></ul>",
  "<p>Third paragraph.</p>",
  "<img src=\"https://example.com/a.jpg\" alt=\"Photo\">",
  "<p>Fourth paragraph.</p>",
].join("");

describe("splitting", () => {
  it("reconstructs the original exactly when the halves are joined", () => {
    const [before, after] = splitHtmlAtMidpoint(doc);
    expect(before + after).toBe(doc);
  });

  it("splits at a top-level boundary, never mid-tag", () => {
    const [before, after] = splitHtmlAtMidpoint(doc);
    expect(before.endsWith(">")).toBe(true);
    expect(after === "" || after.startsWith("<")).toBe(true);
  });

  it("never splits inside a list", () => {
    const [before, after] = splitHtmlAtMidpoint(doc);
    for (const half of [before, after]) {
      const opens = (half.match(/<ul>/g) ?? []).length;
      const closes = (half.match(/<\/ul>/g) ?? []).length;
      expect(opens).toBe(closes);
    }
  });

  it("puts content on both sides of a multi-block document", () => {
    const [before, after] = splitHtmlAtMidpoint(doc);
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBeGreaterThan(0);
  });
});

describe("documents with no real middle", () => {
  it("leaves a single block unsplit", () => {
    const [before, after] = splitHtmlAtMidpoint("<p>Only one paragraph.</p>");
    expect(before).toBe("<p>Only one paragraph.</p>");
    expect(after).toBe("");
  });

  it("handles an empty body without throwing", () => {
    const [before, after] = splitHtmlAtMidpoint("");
    expect(before).toBe("");
    expect(after).toBe("");
  });
});
