import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "h2", "h3", "h4", "b", "strong", "i", "em", "a", "img",
  "ul", "ol", "li", "blockquote", "br", "hr",
];

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }),
    },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Converts plain textarea text (paragraphs separated by a blank line) into
// safe HTML <p> tags. Content that already contains HTML tags is assumed
// to be intentional markup and is passed through sanitizeArticleHtml as-is.
export function bodyInputToHtml(raw: string): string {
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return sanitizeArticleHtml(raw);
  }
  const paragraphs = raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
}
