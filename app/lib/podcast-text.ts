/**
 * Turns a feed's episode description into a one- or two-line teaser.
 *
 * Podcast descriptions are HTML, and usually a full show-notes document:
 * an intro paragraph, then headings, bullet lists of timestamps, sponsor
 * copy and links. Flattening the whole thing produces a run-on smear where
 * a heading collides with the sentence after it ("…hand it over. In this
 * episode The statute they keep citing…").
 *
 * So take the first block that reads like prose instead, which is what
 * Apple and Spotify both surface. Deliberately regex rather than a parser:
 * this is lossy-by-design display text, never markup we render, and the
 * output is escaped by React on the way out.
 */
export function episodeTeaser(html: string, maxLength = 260): string {
  if (!html) return "";

  const withoutNoise = html
    // Drop anything whose text would be meaningless on its own.
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Prefer the first paragraph with real prose in it. A leading <p> holding
  // only a link, an image or a sponsor tag is common, so skip past short
  // ones rather than showing "Support the show" as the teaser.
  const paragraphs = [...withoutNoise.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) =>
    stripToText(m[1])
  );
  const firstProse = paragraphs.find((text) => text.length >= 60);

  const text = firstProse ?? stripToText(withoutNoise);
  if (text.length <= maxLength) return text;

  // Cut on a word boundary so the ellipsis doesn't land mid-word.
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function stripToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
