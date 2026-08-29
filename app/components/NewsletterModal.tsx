"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import SubscribeForm from "./SubscribeForm";

/**
 * The newsletter modal.
 *
 * Designed to be the opposite of the usual newsletter interstitial: it does
 * not fire on arrival, it never returns once dismissed, and it never shows
 * to somebody who has already signed up. A popup that interrupts a reader
 * three seconds in costs more in bounced sessions than it earns in
 * addresses, so this one waits until there is evidence of genuine interest.
 *
 * Trigger: 45 seconds on the page, or 45% scrolled, whichever comes first.
 * Suppressed for 60 days after a dismissal and permanently after a signup,
 * both remembered in localStorage.
 */

const DISMISSED_KEY = "sm_newsletter_dismissed_at";
const SUBSCRIBED_KEY = "sm_newsletter_subscribed";
const DISMISS_DAYS = 60;
const TIME_TRIGGER_MS = 45_000;
const SCROLL_TRIGGER_PCT = 45;

// Pages where a newsletter prompt is either redundant or actively wrong.
const EXCLUDED_PREFIXES = ["/admin", "/preview", "/subscribe", "/login", "/register", "/saved"];

function suppressed(): boolean {
  try {
    if (localStorage.getItem(SUBSCRIBED_KEY)) return true;
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
    if (!dismissedAt) return false;
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    // Storage blocked. Treat as suppressed rather than risk showing the
    // modal on every single page view with no way to make it stop.
    return true;
  }
}

export default function NewsletterModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  /**
   * A signup is permanent suppression, not a 60-day dismissal. Without
   * this, somebody who subscribes in the modal gets it again on the very
   * next page: they never pressed dismiss, so nothing was recorded.
   */
  const onSubscribed = useCallback(() => {
    try {
      localStorage.setItem(SUBSCRIBED_KEY, "1");
    } catch {
      // Storage blocked; the modal stays closed for this page load anyway.
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Nothing to do; the modal is closed for this page load regardless.
    }
  }, []);

  useEffect(() => {
    if (!pathname || EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return;
    if (suppressed()) return;

    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      setOpen(true);
    };

    const timer = window.setTimeout(fire, TIME_TRIGGER_MS);

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if ((window.scrollY / scrollable) * 100 >= SCROLL_TRIGGER_PCT) fire();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  // Focus management and scroll lock, so the modal behaves like a dialog
  // rather than a div that happens to sit on top of the page.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    closeButtonRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      // aria-modal="true" tells assistive tech that the rest of the page is
      // inert, so Tab has to actually stay inside the dialog or that claim
      // is a lie. Cycles between the first and last focusable element.
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      (previouslyFocused.current as HTMLElement | null)?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-modal-title"
    >
      {/* Backdrop. Clicking it closes, same as the X. */}
      <button
        type="button"
        aria-label="Close newsletter signup"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[3px] animate-[fadein_0.3s_ease-out_both]"
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-[520px] overflow-hidden rounded-card shadow-pop animate-[overlayPop_0.42s_cubic-bezier(0.16,1,0.3,1)_both]">
        {/* Same navy gradient + red glow language as the subscribe page
            header and the site's other dark panels, so this reads as part
            of the brand rather than a bolted-on widget. */}
        <div className="relative bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-dark)] px-6 py-8 sm:px-9 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(120% 90% at 15% 0%, rgba(200,16,46,0.28) 0%, transparent 55%), radial-gradient(100% 80% at 100% 100%, rgba(28,90,166,0.22) 0%, transparent 60%)",
            }}
          />

          <button
            type="button"
            onClick={close}
            ref={closeButtonRef}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white active:scale-[0.94]"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative">
            <p className="font-sans text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--color-red-ink)]">
              <span className="mr-2 inline-block h-1 w-1 rounded-full bg-[var(--color-red)] align-middle" />
              Free newsletter
            </p>

            <h2
              id="newsletter-modal-title"
              className="font-headline mt-3 text-[30px] font-bold uppercase leading-[0.98] tracking-[-0.02em] text-white sm:text-[36px]"
            >
              The stories mainstream media won&apos;t run
            </h2>

            <p className="mt-3 max-w-[42ch] text-[15px] leading-[1.55] text-white/70">
              Straight to your inbox. No corporate spin, no filler, and no cost. Unsubscribe whenever you want.
            </p>

            <div className="mt-6">
              <SubscribeForm
                stacked
                source="modal"
                onDark
                successMessage="You're on the list. Watch your inbox."
                onSuccess={onSubscribed}
              />
            </div>

            <button
              type="button"
              onClick={close}
              className="mt-4 min-h-11 font-sans text-[12px] text-white/45 underline-offset-4 transition hover:text-white/70 hover:underline"
            >
              No thanks, keep reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
