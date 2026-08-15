import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (src: string, title?: string) => ReturnType;
    };
  }
}

export type EmbedProvider = "youtube" | "x" | "vimeo" | "spotify" | "soundcloud" | "rumble" | "unknown";

/**
 * Turns a URL an editor pasted into the embeddable iframe URL for that
 * provider. Returns null when the URL isn't from a provider we support —
 * the caller then leaves it as a plain link rather than producing an
 * iframe the sanitizer would strip on save anyway (lib/sanitize.ts's
 * allowedIframeHostnames is the matching half of this list).
 */
export function toEmbedUrl(raw: string): { src: string; provider: EmbedProvider } | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  // YouTube — watch links, short links, and already-embed links.
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") ?? (url.pathname.startsWith("/embed/") ? url.pathname.slice(7) : null);
    if (id) return { src: `https://www.youtube-nocookie.com/embed/${id}`, provider: "youtube" };
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    if (id) return { src: `https://www.youtube-nocookie.com/embed/${id}`, provider: "youtube" };
  }

  // X / Twitter — platform.twitter.com still serves the embeddable widget
  // for both x.com and twitter.com status URLs.
  if (host === "x.com" || host === "twitter.com") {
    const match = /\/([^/]+)\/status\/(\d+)/.exec(url.pathname);
    if (match) {
      return {
        src: `https://platform.twitter.com/embed/Tweet.html?id=${match[2]}`,
        provider: "x",
      };
    }
  }

  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) return { src: `https://player.vimeo.com/video/${id}`, provider: "vimeo" };
  }

  // Spotify — episodes and shows, which is what a podcast site needs.
  if (host === "open.spotify.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { src: `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`, provider: "spotify" };
    }
  }

  if (host === "soundcloud.com") {
    return {
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.toString())}`,
      provider: "soundcloud",
    };
  }

  if (host === "rumble.com" && url.pathname.startsWith("/embed/")) {
    return { src: url.toString(), provider: "rumble" };
  }

  return null;
}

/**
 * A responsive iframe embed. Kept as one generic node rather than a node
 * per provider: they all render identically (a 16:9 iframe in a wrapper),
 * and the provider-specific work is entirely in URL normalization above.
 */
export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: "Embedded content" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.embed-wrapper",
        getAttrs: (element) => {
          const iframe = (element as HTMLElement).querySelector("iframe");
          if (!iframe) return false;
          return { src: iframe.getAttribute("src"), title: iframe.getAttribute("title") ?? "Embedded content" };
        },
      },
      {
        tag: "iframe[src]",
        getAttrs: (element) => ({
          src: (element as HTMLIFrameElement).getAttribute("src"),
          title: (element as HTMLIFrameElement).getAttribute("title") ?? "Embedded content",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, title } = HTMLAttributes as { src: string; title: string };
    return [
      "div",
      { class: "embed-wrapper" },
      [
        "iframe",
        mergeAttributes({
          src,
          title,
          width: "560",
          height: "315",
          frameborder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
        }),
      ],
    ];
  },

  addCommands() {
    return {
      setEmbed:
        (src, title = "Embedded content") =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { src, title } }),
    };
  },
});

export default Embed;
