import sanitizeHtml from "sanitize-html";

// The allowlist and the editor's toolbar are two halves of one contract:
// every tag the editor can produce must be listed here, and nothing here
// should be un-producible from the editor. When adding a node to
// RichTextEditor, add its tag here in the same change — otherwise the
// feature silently works in the editor and vanishes on save.
const ALLOWED_TAGS = [
  // Text + structure
  "p", "h2", "h3", "h4", "b", "strong", "i", "em", "u", "s", "br", "hr",
  "ul", "ol", "li", "blockquote",
  // Code
  "pre", "code",
  // Tables
  "table", "thead", "tbody", "tr", "th", "td",
  // Media
  "a", "img", "figure", "figcaption", "iframe",
  // Callouts / alert boxes (a div carrying a callout-* class)
  "div", "span",
];

// Only hosts we deliberately support embedding from. sanitize-html
// enforces this against the iframe's src, so a pasted iframe pointing
// anywhere else is dropped entirely rather than rendered.
const ALLOWED_IFRAME_HOSTNAMES = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
  "platform.twitter.com",
  "open.spotify.com",
  "w.soundcloud.com",
  "player.rumble.com",
  "rumble.com",
  "iframe.iframely.es",
];

// Classes the editor's own nodes rely on. Anything else is stripped, so a
// pasted document can't smuggle in arbitrary styling hooks.
const ALLOWED_CLASSES = {
  div: ["callout", "callout-info", "callout-warning", "callout-danger", "callout-success", "embed-wrapper"],
  figure: ["article-figure", "align-left", "align-center", "align-right", "align-full"],
  img: ["align-left", "align-center", "align-right", "align-full"],
  pre: ["code-block"],
  span: ["callout-title"],
  table: ["article-table"],
};

// Our own origin, matched so an editor who pastes a full absolute URL to a
// Stucci Media page gets the same treatment as one who writes a relative
// path. Same env-var-with-hardcoded-fallback pattern used across the app
// (robots.ts, lib/sitemap-xml.ts, the article and category pages).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";
const INTERNAL_HOSTNAMES = (() => {
  try {
    const host = new URL(SITE_URL).hostname.toLowerCase();
    const bare = host.replace(/^www\./, "");
    return new Set([bare, `www.${bare}`]);
  } catch {
    return new Set<string>();
  }
})();

// A link is internal when it stays on this site: a root-relative path, a
// bare fragment or query, or an absolute URL on our own hostname. Note the
// `//` guard — a protocol-relative `//evil.com` starts with a slash but is
// very much not our page.
function isInternalHref(href: string): boolean {
  const target = href.trim();
  if (!target) return false;
  if (target.startsWith("//")) return false;
  if (target.startsWith("/") || target.startsWith("#") || target.startsWith("?")) return true;
  try {
    return INTERNAL_HOSTNAMES.has(new URL(target).hostname.toLowerCase());
  } catch {
    // Not parseable as an absolute URL and not root-relative (e.g. a bare
    // "example.com"). Treat it as outbound, which is the safe default.
    return false;
  }
}

// Outbound links are always forced to carry noopener/noreferrer/nofollow.
// That guarantee is the whole point of doing this in the sanitizer rather
// than trusting the editor: no pasted or hand-written anchor can leak a
// dofollow vote to somewhere we did not vouch for. Extra rel tokens the
// author set deliberately (`sponsored` on a paid link, `ugc`) are merged in
// rather than overwritten, so intent survives without weakening the floor.
//
// Internal links get none of it. `nofollow` on our own pages throws away
// internal link equity on every article an editor writes, and forcing
// `target="_blank"` on in-site navigation is hostile to the reader.
const REQUIRED_OUTBOUND_REL = ["noopener", "noreferrer", "nofollow"];

function transformAnchor(tagName: string, attribs: Record<string, string>) {
  if (isInternalHref(attribs.href ?? "")) {
    return { tagName, attribs };
  }
  const authored = (attribs.rel ?? "").split(/\s+/).filter(Boolean);
  const rel = [...new Set([...authored, ...REQUIRED_OUTBOUND_REL])].join(" ");
  return {
    tagName,
    attribs: { ...attribs, rel, target: attribs.target || "_blank" },
  };
}

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "class", "style"],
      figure: ["class"],
      div: ["class"],
      span: ["class"],
      pre: ["class"],
      code: ["class"],
      table: ["class"],
      th: ["colspan", "rowspan", "style"],
      td: ["colspan", "rowspan", "style"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
    },
    allowedClasses: ALLOWED_CLASSES,
    // TipTap's TextAlign extension emits inline text-align, and the image
    // node emits an explicit width for resizing. Both are bounded by the
    // regex allowlist below — no arbitrary CSS gets through.
    allowedStyles: {
      "*": {
        "text-align": [/^left$|^right$|^center$|^justify$/],
      },
      img: {
        width: [/^\d{1,3}%$/, /^\d{1,4}px$/],
      },
    },
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTNAMES,
    allowedSchemes: ["http", "https"],
    transformTags: {
      a: transformAnchor,
    },
    // Stripping a disallowed iframe's src leaves the element itself behind,
    // and an <iframe> with no src still renders as a ~150px empty box. That
    // shows up wherever the HTML isn't ours — podcast show notes routinely
    // carry player and tracker embeds from hosts that aren't allowlisted —
    // so drop the shell too. Same for an <img> whose src didn't survive.
    exclusiveFilter: (frame) =>
      (frame.tag === "iframe" || frame.tag === "img") && !frame.attribs.src,
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
