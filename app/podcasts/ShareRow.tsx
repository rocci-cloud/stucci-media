"use client";

import { useState } from "react";
import { Link2, Check, Share2 } from "lucide-react";

/**
 * Share controls for an episode.
 *
 * Copy-link first, because that is what people actually use, and it is the
 * only option guaranteed to work everywhere. The native share sheet is
 * offered only where the browser supports it (phones, mostly) rather than
 * rendering a button that silently does nothing on desktop. X and Facebook
 * are plain links — no SDKs, no trackers, nothing that would load
 * third-party script onto the page.
 */
export default function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const linkClass =
    "inline-flex min-h-11 items-center gap-2 rounded-control border border-[var(--color-hairline)] px-4 font-sans text-[13px] font-bold text-[var(--color-gray)] transition hover:border-[var(--color-navy)] hover:text-[var(--color-text)] active:scale-[0.97]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={linkClass}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            // Clipboard access can be refused (insecure context, or the
            // user declined). Say nothing rather than throwing — the URL
            // is in the address bar either way.
          }
        }}
      >
        {copied ? <Check className="h-[16px] w-[16px]" /> : <Link2 className="h-[16px] w-[16px]" />}
        {copied ? "Link copied" : "Copy link"}
      </button>

      {canShare && (
        <button
          type="button"
          className={linkClass}
          onClick={() => {
            void navigator.share({ title, url }).catch(() => {
              // Dismissing the share sheet rejects; that is not an error.
            });
          }}
        >
          <Share2 className="h-[16px] w-[16px]" />
          Share
        </button>
      )}

      <a
        className={linkClass}
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Post on X
      </a>
      <a
        className={linkClass}
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Facebook
      </a>
    </div>
  );
}
