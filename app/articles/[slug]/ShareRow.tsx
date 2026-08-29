"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Mail } from "lucide-react";

// A compact share row, not a social wall. Four affordances at 36px, sitting
// on a hairline rule under the byline.
//
// The URL is read from the browser rather than passed in: this component
// renders inside an ISR-cached page, so a server-built absolute URL would
// be baked into the cached HTML and every share would carry whichever host
// rendered it.
export default function ShareRow({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
    } catch {
      // Clipboard access is denied in some embedded and insecure contexts.
      // Silent is right here: the other three buttons still work, and an
      // error toast for a failed copy is louder than the action was.
    }
  }

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const link =
    "inline-flex h-9 w-9 items-center justify-center rounded-[2px] border border-[var(--color-hairline)] text-[var(--color-gray)] transition-colors hover:border-[var(--color-red)] hover:text-[var(--color-red-ink)]";

  return (
    <div className="flex items-center gap-2 border-y border-[var(--color-hairline)] py-2.5">
      <span className="mr-1 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-gray-light)]">
        Share
      </span>

      <a
        className={link}
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
      >
        {/* lucide 1.x removed its brand icons, so both social marks are
            inline paths rather than a dependency that no longer ships them. */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
        </svg>
      </a>

      <a
        className={link}
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
      >
        {/* lucide dropped its Twitter glyph and has no X mark, so this is
            the wordmark as a path rather than a stale bird. */}
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M18.9 2H22l-7.1 8.1L23.2 22h-6.6l-5.1-6.7L5.6 22H2.5l7.6-8.7L1.2 2h6.8l4.6 6.1L18.9 2Zm-1.1 18h1.7L7.3 3.8H5.5L17.8 20Z" />
        </svg>
      </a>

      <a
        className={link}
        href={`mailto:?subject=${encodedTitle}&body=${encoded}`}
        aria-label="Share by email"
      >
        <Mail className="h-4 w-4" />
      </a>

      <button type="button" onClick={copy} className={link} aria-label={copied ? "Link copied" : "Copy link"}>
        {copied ? <Check className="h-4 w-4 text-[var(--color-red-ink)]" /> : <Link2 className="h-4 w-4" />}
      </button>

      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
