import { describe, expect, it } from "vitest";
import { computeSeoScore } from "../app/lib/seo-score";

// The same function backs the editor's live panel and the articles list's SEO
// column, so the number can never disagree between the two places it's shown.

const wellOptimized = {
  seoTitle: "County Budget Vote Collapses After Walkout",
  seoDescription:
    "A procedural objection ended a four-hour budget hearing with no vote and no rescheduled date, leaving the county without an approved budget.",
  seoKeywords: "budget vote",
  slug: "county-budget-vote-collapses",
  bodyHtml: "<p>The budget vote collapsed.</p>".repeat(40),
  headline: "County Budget Vote Collapses After Walkout",
  dek: "A procedural objection ended the hearing.",
  coverImageUrl: "https://example.com/cover.jpg",
};

describe("scoring", () => {
  it("returns 0-100 and rates a well-optimized article highly", () => {
    const result = computeSeoScore(wellOptimized);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThan(70);
  });

  it("rates an empty article lower than a complete one", () => {
    const empty = computeSeoScore({
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      slug: "",
      bodyHtml: "",
      headline: "",
      dek: "",
      coverImageUrl: null,
    });
    expect(empty.score).toBeLessThan(computeSeoScore(wellOptimized).score);
  });

  it("ignores a stray leading comma in the keyword list", () => {
    // A leading comma used to produce an empty focus keyword, which silently
    // failed every keyword check.
    const withComma = computeSeoScore({ ...wellOptimized, seoKeywords: ",budget vote" });
    expect(withComma.score).toBe(computeSeoScore(wellOptimized).score);
  });

  it("is deterministic for the same input", () => {
    expect(computeSeoScore(wellOptimized).score).toBe(computeSeoScore(wellOptimized).score);
  });
});
