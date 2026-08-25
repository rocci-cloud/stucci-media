import { sanitizeArticleHtml } from "./sanitize";
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

/**
 * Turns a feed's episode description into HTML fit to render.
 *
 * Publishers split roughly in half. Some put real HTML in the description;
 * that goes straight to the sanitiser. The rest put **plain text** — and
 * because the result is rendered as HTML, every newline in it collapses,
 * so a tidy set of show notes arrives on the page as one unbroken wall.
 * Timestamp lists suffer worst: "00:00 Intro\n04:12 The records fight"
 * becomes a single run-on line.
 *
 * So plain text is converted: blank lines start a new paragraph, single
 * newlines become breaks (a timestamp list is single-spaced and every line
 * matters), and bare URLs become links, since show notes are full of
 * pasted links that would otherwise be dead text.
 *
 * The plain-text branch escapes before it inserts any markup, so a
 * description containing "<script>" is displayed, never executed. The HTML
 * branch is the sanitiser's job.
 */
export function showNotesToHtml(raw: string): string {
  if (!raw.trim()) return "";

  // Anything with a real tag in it is HTML; hand it to the sanitiser.
  if (/<[a-z][^>]*>/i.test(raw)) return sanitizeArticleHtml(raw);

  const paragraphs = raw
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block
        .split(/\r?\n/)
        .map((line) => autolink(escapeHtml(line.trim())))
        .join("<br />")
    );

  return paragraphs.map((p) => `<p>${p}</p>`).join("\n");
}

/**
 * Links bare URLs in already-escaped text.
 *
 * Runs after escaping, so the pattern only ever sees inert text and the
 * href it builds cannot carry markup. Trailing punctuation is left outside
 * the link — "see example.com." should not link the full stop.
 */
function autolink(escaped: string): string {
  return escaped.replace(
    /\bhttps?:\/\/[^\s<]+/gi,
    (match) => {
      const trimmed = match.replace(/[.,;:!?)\]]+$/, "");
      const trailing = match.slice(trimmed.length);
      return `<a href="${trimmed}" target="_blank" rel="noopener noreferrer nofollow">${trimmed}</a>${trailing}`;
    }
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Cleans audio-production leftovers off an episode title.
 *
 * Publishers routinely publish with the working filename still attached —
 * "…A Blessing With A Purpose_mixdown". Only a short list of known
 * production tokens is stripped, and only as a trailing underscore or
 * hyphen suffix, so a real title is never touched.
 */
export function cleanEpisodeTitle(title: string): string {
  return title
    .replace(/[_-](mixdown|master|mastered|final|edit|edited|clean|v\d+|mix)\s*$/i, "")
    .replace(/\.(mp3|m4a|wav)\s*$/i, "")
    .trim();
}
