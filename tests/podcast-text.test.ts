import { describe, expect, it } from "vitest";
import { showNotesToHtml, cleanEpisodeTitle, episodeTeaser } from "../app/lib/podcast-text";

describe("showNotesToHtml", () => {
  it("splits plain text on blank lines into paragraphs", () => {
    const html = showNotesToHtml("First para.\n\nSecond para.");
    expect(html).toBe("<p>First para.</p>\n<p>Second para.</p>");
  });

  it("keeps single newlines as breaks, so timestamp lists stay readable", () => {
    const html = showNotesToHtml("In this episode:\n00:00 Intro\n04:12 The fight");
    expect(html).toBe("<p>In this episode:<br />00:00 Intro<br />04:12 The fight</p>");
  });

  it("links bare URLs without swallowing trailing punctuation", () => {
    const html = showNotesToHtml("Notes at https://example.com/ep, and more.");
    expect(html).toContain('href="https://example.com/ep"');
    expect(html).toContain(">https://example.com/ep</a>, and more.");
  });

  it("passes real HTML to the sanitiser rather than escaping it", () => {
    const html = showNotesToHtml("<p>Real <strong>markup</strong>.</p>");
    expect(html).toContain("<strong>markup</strong>");
  });

  it("never executes script in a plain-text description", () => {
    const html = showNotesToHtml("Look <script>alert(1)</script> out");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
  });

  it("escapes angle brackets that are not markup", () => {
    expect(showNotesToHtml("5 > 3 & 2 < 4")).toBe("<p>5 &gt; 3 &amp; 2 &lt; 4</p>");
  });

  it("returns nothing for an empty description", () => {
    expect(showNotesToHtml("   ")).toBe("");
  });
});

describe("cleanEpisodeTitle", () => {
  it("strips an underscore-joined production suffix", () => {
    expect(cleanEpisodeTitle("A Blessing With A Purpose_mixdown")).toBe("A Blessing With A Purpose");
  });

  it("strips a trailing audio file extension", () => {
    expect(cleanEpisodeTitle("intro.mp3")).toBe("intro");
  });

  it("leaves a real title alone even when it contains a production word", () => {
    expect(cleanEpisodeTitle("A Real Title About Mix Tapes")).toBe("A Real Title About Mix Tapes");
  });

  it("leaves a spaced, capitalised word alone — it may be part of the title", () => {
    expect(cleanEpisodeTitle("Episode 12 - Final")).toBe("Episode 12 - Final");
  });

  it("is idempotent, since it runs on both import and read", () => {
    const once = cleanEpisodeTitle("Show_mixdown");
    expect(cleanEpisodeTitle(once)).toBe(once);
  });
});

describe("episodeTeaser", () => {
  it("prefers the first real paragraph over flattening the whole document", () => {
    const teaser = episodeTeaser(
      "<p>The intro paragraph that runs long enough to count as real prose here.</p><h2>Chapters</h2><ul><li>00:00</li></ul>"
    );
    expect(teaser).toBe("The intro paragraph that runs long enough to count as real prose here.");
  });

  it("cuts on a word boundary", () => {
    const teaser = episodeTeaser("word ".repeat(80), 40);
    expect(teaser.endsWith("…")).toBe(true);
    expect(teaser).not.toContain("wor…");
  });
});
