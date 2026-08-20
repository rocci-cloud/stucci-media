import { describe, expect, it } from "vitest";
import { slugify } from "../app/lib/slugify";

// Author page URLs are built by running slugify() over a byline, and the
// lookup resolves the URL by running it over the stored bylines again. An
// earlier version reimplemented the rule in SQL and the two drifted — a
// byline like "Rocci - Stucci" linked to /author/rocci-stucci while the query
// computed "rocci---stucci", so the page 404'd. These lock the shape of the
// rule so any future second implementation has something to match.

describe("slugify", () => {
  it.each([
    ["Rocci Stucci", "rocci-stucci"],
    ["Jean-Luc Picard", "jean-luc-picard"],
    ["O'Brien Smith", "obrien-smith"],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("collapses runs of hyphens", () => {
    expect(slugify("Mary--Jane Smith")).toBe("mary-jane-smith");
    expect(slugify("Rocci - Stucci")).toBe("rocci-stucci");
    expect(slugify("Ana  -  Lopez")).toBe("ana-lopez");
  });

  it("treats every kind of whitespace as a separator, not just spaces", () => {
    expect(slugify("Rocci\tStucci")).toBe("rocci-stucci");
    expect(slugify("Rocci\nStucci")).toBe("rocci-stucci");
  });

  it("drops punctuation rather than turning it into separators", () => {
    expect(slugify("Smith, Jr.")).toBe("smith-jr");
    expect(slugify("Ana (Editor)")).toBe("ana-editor");
  });

  it("is idempotent — slugifying a slug returns the same slug", () => {
    for (const name of ["Rocci - Stucci", "Mary--Jane Smith", "O'Brien Smith"]) {
      expect(slugify(slugify(name))).toBe(slugify(name));
    }
  });
});
