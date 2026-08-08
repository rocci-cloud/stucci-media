// Splits sanitized article body HTML into two halves at the nearest
// top-level block boundary to the string's midpoint, so a mid-article
// banner can render between two real block elements instead of inside
// one (which would break markup). Deliberately hand-rolled instead of
// pulling in a full HTML parser: app/lib/sanitize.ts's allowlist is small
// and fixed (p, h2-h4, ul, ol, li, blockquote, img, hr, plus inline b/
// strong/i/em/a/br), so a depth-tracking tag scanner is enough to find
// correct top-level boundaries without needing a real DOM.
const VOID_TAGS = new Set(["img", "br", "hr"]);
const TAG_RE = /<(\/?)([a-zA-Z0-9]+)([^>]*)>/g;

function findTopLevelBoundaries(html: string): number[] {
  const boundaries: number[] = [];
  let depth = 0;
  let match: RegExpExecArray | null;

  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(html))) {
    const [full, closingSlash, tagName] = match;
    const isVoid = VOID_TAGS.has(tagName.toLowerCase());

    if (closingSlash) {
      depth = Math.max(0, depth - 1);
      if (depth === 0) boundaries.push(match.index + full.length);
    } else if (isVoid) {
      if (depth === 0) boundaries.push(match.index + full.length);
    } else {
      depth += 1;
    }
  }

  return boundaries;
}

// Returns [firstHalf, secondHalf]. If the content is too short to have a
// meaningful midpoint (fewer than 2 top-level blocks), returns the whole
// thing as the first half and an empty second half — callers should skip
// rendering anything between them in that case.
export function splitHtmlAtMidpoint(html: string): [string, string] {
  const boundaries = findTopLevelBoundaries(html);
  if (boundaries.length < 2) return [html, ""];

  const midpoint = html.length / 2;
  const splitAt = boundaries.reduce((closest, boundary) =>
    Math.abs(boundary - midpoint) < Math.abs(closest - midpoint) ? boundary : closest
  );

  return [html.slice(0, splitAt), html.slice(splitAt)];
}
