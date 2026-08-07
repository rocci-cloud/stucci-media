// Pure, dependency-free SEO scoring — shared by the editor's live panel
// (client) and the articles list's SEO Score column (server), so the
// number never disagrees between the two places it's shown.

export type SeoCheckStatus = "good" | "warning" | "bad";

export type SeoCheck = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  detail: string;
};

export type SeoInput = {
  headline: string;
  seoTitle: string | null;
  dek: string;
  seoDescription: string | null;
  seoKeywords: string | null;
  slug: string;
  coverImageUrl: string | null;
  bodyHtml: string;
};

export type SeoResult = {
  score: number;
  checks: SeoCheck[];
};

const POINTS: Record<string, number> = {
  title: 20,
  description: 20,
  keyword: 20,
  slug: 15,
  image: 15,
  content: 10,
};

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// First non-empty comma-separated entry — `input.seoKeywords` being
// something like ", focus keyword" (stray leading comma) shouldn't read as
// "no focus keyword set" just because index 0 happened to be blank.
function firstKeyword(raw: string | null): string {
  const parts = (raw || "").split(",").map((p) => p.trim()).filter(Boolean);
  return (parts[0] ?? "").toLowerCase();
}

export function computeSeoScore(input: SeoInput): SeoResult {
  const title = (input.seoTitle || input.headline || "").trim();
  const description = (input.seoDescription || input.dek || "").trim();
  const keyword = firstKeyword(input.seoKeywords);
  const slug = input.slug.trim();
  const bodyText = plainText(input.bodyHtml || "");
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;

  const checks: SeoCheck[] = [];
  let score = 0;

  // Title length
  if (!title) {
    checks.push({ id: "title", label: "SEO title", status: "bad", detail: "Missing — add a title." });
  } else if (title.length < 30) {
    checks.push({ id: "title", label: "SEO title", status: "warning", detail: `${title.length} chars — a bit short, aim for 50–60.` });
    score += POINTS.title * 0.5;
  } else if (title.length <= 60) {
    checks.push({ id: "title", label: "SEO title", status: "good", detail: `${title.length} chars — good length.` });
    score += POINTS.title;
  } else {
    checks.push({ id: "title", label: "SEO title", status: "warning", detail: `${title.length} chars — Google may truncate past ~60.` });
    score += POINTS.title * 0.6;
  }

  // Description length
  if (!description) {
    checks.push({ id: "description", label: "Meta description", status: "bad", detail: "Missing — add a description." });
  } else if (description.length < 100) {
    checks.push({ id: "description", label: "Meta description", status: "warning", detail: `${description.length} chars — aim for 120–160.` });
    score += POINTS.description * 0.5;
  } else if (description.length <= 160) {
    checks.push({ id: "description", label: "Meta description", status: "good", detail: `${description.length} chars — good length.` });
    score += POINTS.description;
  } else {
    checks.push({ id: "description", label: "Meta description", status: "warning", detail: `${description.length} chars — Google may truncate past ~160.` });
    score += POINTS.description * 0.6;
  }

  // Focus keyword presence
  if (!keyword) {
    checks.push({ id: "keyword", label: "Focus keyword", status: "bad", detail: "No focus keyword set." });
  } else {
    const inTitle = title.toLowerCase().includes(keyword);
    const inDescription = description.toLowerCase().includes(keyword);
    const inSlug = slug.toLowerCase().includes(keyword.replace(/\s+/g, "-"));
    const inBody = bodyText.toLowerCase().includes(keyword);
    const hits = [inTitle, inDescription, inSlug, inBody].filter(Boolean).length;
    if (hits >= 3) {
      checks.push({ id: "keyword", label: "Focus keyword", status: "good", detail: `"${keyword}" found in title, description, slug, and/or content.` });
      score += POINTS.keyword;
    } else if (hits >= 1) {
      checks.push({ id: "keyword", label: "Focus keyword", status: "warning", detail: `"${keyword}" only found in ${hits} of 4 key places.` });
      score += POINTS.keyword * 0.5;
    } else {
      checks.push({ id: "keyword", label: "Focus keyword", status: "bad", detail: `"${keyword}" doesn't appear in the title, description, slug, or content.` });
    }
  }

  // Slug quality
  if (!slug) {
    checks.push({ id: "slug", label: "URL slug", status: "bad", detail: "Missing slug." });
  } else if (slug.length <= 60 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    checks.push({ id: "slug", label: "URL slug", status: "good", detail: "Clean and readable." });
    score += POINTS.slug;
  } else {
    checks.push({ id: "slug", label: "URL slug", status: "warning", detail: "Long or non-standard — shorter is better." });
    score += POINTS.slug * 0.5;
  }

  // Image
  if (input.coverImageUrl) {
    checks.push({ id: "image", label: "Featured image", status: "good", detail: "Set." });
    score += POINTS.image;
  } else {
    checks.push({ id: "image", label: "Featured image", status: "bad", detail: "No image — articles with images perform better in search and social." });
  }

  // Content length
  if (wordCount === 0) {
    checks.push({ id: "content", label: "Content length", status: "bad", detail: "No content yet." });
  } else if (wordCount < 300) {
    checks.push({ id: "content", label: "Content length", status: "warning", detail: `${wordCount} words — aim for 300+.` });
    score += POINTS.content * 0.5;
  } else {
    checks.push({ id: "content", label: "Content length", status: "good", detail: `${wordCount} words.` });
    score += POINTS.content;
  }

  // --- Advisory checks below: shown in the checklist for guidance, but
  // deliberately don't add/subtract points. Both are real SEO/accessibility
  // factors the 6 scored checks above don't cover, but folding them into
  // the score would retroactively change the number for every article
  // that's already been scored (and hand-tuned to it) without them —
  // surfacing the issue is more useful here than moving the score.

  // Image alt text (accessibility + image search ranking factor)
  const imgTags = input.bodyHtml.match(/<img[^>]*>/gi) ?? [];
  if (imgTags.length > 0) {
    const missingAlt = imgTags.filter((tag) => !/\balt\s*=\s*["'][^"']+["']/i.test(tag)).length;
    if (missingAlt === 0) {
      checks.push({ id: "imageAlt", label: "Image alt text", status: "good", detail: `All ${imgTags.length} image${imgTags.length === 1 ? "" : "s"} have alt text.` });
    } else {
      checks.push({
        id: "imageAlt",
        label: "Image alt text",
        status: "warning",
        detail: `${missingAlt} of ${imgTags.length} image${imgTags.length === 1 ? "" : "s"} missing alt text.`,
      });
    }
  }

  // Keyword stuffing — the score above only rewards keyword presence and
  // would otherwise have no way to flag overuse.
  if (keyword && wordCount > 0) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const occurrences = (bodyText.toLowerCase().match(new RegExp(`\\b${escaped}\\b`, "g")) ?? []).length;
    const density = occurrences / wordCount;
    if (density > 0.03) {
      checks.push({
        id: "keywordDensity",
        label: "Keyword density",
        status: "warning",
        detail: `"${keyword}" appears ${occurrences} times (${Math.round(density * 100)}% of content) — may read as keyword stuffing.`,
      });
    }
  }

  return { score: Math.round(score), checks };
}
