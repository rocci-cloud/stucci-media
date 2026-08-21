import { describe, expect, it } from "vitest";
import {
  FEATURE_ARTICLE_PRICE,
  buildFeatureArticleSchema,
} from "../app/lib/feature-article-schema";

const SITE = "https://www.stuccimedia.com";
const FAQS = [
  { q: "Why $125?", a: "It's a flat fee for a piece of work." },
  { q: "How fast is it?", a: "Typically published within 72 hours." },
];

const schemas = buildFeatureArticleSchema(SITE, "72 hours", FAQS);
const byType = (t: string) => schemas.find((s) => s["@type"] === t) as Record<string, unknown>;

// Structured data fails silently: a malformed block loses rich results with
// no error anywhere. These pin the shapes search and answer engines read.
describe("feature article structured data", () => {
  it("emits Service, FAQPage and BreadcrumbList", () => {
    expect(schemas.map((s) => s["@type"]).sort()).toEqual(["BreadcrumbList", "FAQPage", "Service"]);
  });

  it("serialises to valid JSON", () => {
    for (const schema of schemas) {
      expect(() => JSON.parse(JSON.stringify(schema))).not.toThrow();
    }
  });

  it("prices the offer in USD and links it to the page", () => {
    const offer = byType("Service").offers as Record<string, unknown>;
    expect(offer.price).toBe(FEATURE_ARTICLE_PRICE);
    expect(offer.priceCurrency).toBe("USD");
    expect(offer.url).toBe(`${SITE}/feature-article`);
  });

  // The whole reason the builder takes the FAQ list rather than owning its
  // own copy: schema that answers a question the page no longer shows is
  // worse than no schema, because it is what gets quoted back at people.
  it("mirrors exactly the FAQs the page renders", () => {
    const faq = byType("FAQPage").mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(faq).toHaveLength(FAQS.length);
    expect(faq.map((f) => f.name)).toEqual(FAQS.map((f) => f.q));
    expect(faq.map((f) => f.acceptedAnswer.text)).toEqual(FAQS.map((f) => f.a));
  });

  it("gives every FAQ entry the shape Google requires", () => {
    const faq = byType("FAQPage").mainEntity as Record<string, unknown>[];
    for (const entry of faq) {
      expect(entry["@type"]).toBe("Question");
      expect(typeof entry.name).toBe("string");
      const answer = entry.acceptedAnswer as Record<string, unknown>;
      expect(answer["@type"]).toBe("Answer");
      expect((answer.text as string).length).toBeGreaterThan(0);
    }
  });

  // The service page has to attach to the sitewide publisher entity, not
  // float as an unrelated business, or answer engines read two orgs.
  it("references the sitewide organization entity by id", () => {
    expect(byType("Service").provider).toEqual({ "@id": `${SITE}/#organization` });
  });

  it("carries the configured turnaround into the description", () => {
    const withFive = buildFeatureArticleSchema(SITE, "5 business days", FAQS);
    const service = withFive.find((s) => s["@type"] === "Service") as unknown as {
      description: string;
    };
    expect(service.description).toContain("5 business days");
    expect(service.description).not.toContain("72 hours");
  });

  it("orders breadcrumbs from home to the page", () => {
    const crumbs = byType("BreadcrumbList").itemListElement as { position: number; item: string }[];
    expect(crumbs.map((c) => c.position)).toEqual([1, 2]);
    expect(crumbs[0].item).toBe(SITE);
    expect(crumbs[1].item).toBe(`${SITE}/feature-article`);
  });
});
