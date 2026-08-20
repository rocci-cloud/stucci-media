import { describe, expect, it } from "vitest";
import { digestEmail, welcomeEmail } from "../app/lib/email-templates";
import type { DigestArticle } from "../app/lib/digest";

const article = (over: Partial<DigestArticle> = {}): DigestArticle => ({
  id: 1,
  slug: "a-real-story",
  headline: "A Real Story",
  dek: "What happened and why it matters.",
  category: "Political News",
  coverImageUrl: null,
  date: "August 20",
  author: "Rocci Stucci",
  ...over,
});

describe("welcome email", () => {
  it("has a subject, HTML and a plain-text alternative", () => {
    const mail = welcomeEmail();
    expect(mail.subject.length).toBeGreaterThan(0);
    expect(mail.html).toContain("<!doctype html>");
    expect(mail.text.length).toBeGreaterThan(0);
    // Some clients and most spam filters want a text part, and it must not
    // just be the HTML with tags left in.
    expect(mail.text).not.toContain("<");
  });
});

describe("digest email", () => {
  it("leads its subject with the top story", () => {
    const mail = digestEmail([article({ headline: "Budget Vote Collapses" })]);
    expect(mail.subject).toContain("Budget Vote Collapses");
  });

  it("links every article to its real URL", () => {
    const mail = digestEmail([article({ slug: "story-one" }), article({ id: 2, slug: "story-two" })]);
    expect(mail.html).toContain("/articles/story-one");
    expect(mail.html).toContain("/articles/story-two");
  });

  it("escapes HTML in headlines rather than injecting it", () => {
    const mail = digestEmail([article({ headline: 'Ampersand & "quotes" <script>' })]);
    expect(mail.html).toContain("&amp;");
    expect(mail.html).not.toContain("<script>");
  });

  it("percent-encodes slugs so an odd slug can't break the href", () => {
    const mail = digestEmail([article({ slug: "a b" })]);
    expect(mail.html).toContain("/articles/a%20b");
  });

  it("falls back to a generic subject when there is nothing to send", () => {
    const mail = digestEmail([]);
    expect(mail.subject).toBe("Your weekly brief from Stucci Media");
  });
});
