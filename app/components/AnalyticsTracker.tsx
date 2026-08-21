"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * First-party page-view and engagement tracking.
 *
 * Deliberately first-party rather than a third-party script: the data lands
 * in this project's own database, so the admin dashboard can query it
 * directly instead of linking out to somebody else's console.
 *
 * Two writes per page. The view is recorded on arrival and returns an id;
 * when the page is hidden or closed, a beacon reports how long the tab was
 * actually visible and how far down the page the reader got. A visitor who
 * closes the laptop lid mid-article never sends the second write, which is
 * why duration is nullable and every average over it ignores nulls rather
 * than counting them as a zero-second read.
 */

const SESSION_KEY = "sm_session";
const SESSION_TOUCHED_KEY = "sm_session_at";
const SESSION_IDLE_MS = 30 * 60 * 1000;

/**
 * A visit id that survives navigation within the tab but not a new visit.
 * Stored in sessionStorage, not a cookie, and never leaves as an identifier
 * of a person: it exists so the pages of one visit can be grouped, which is
 * what makes bounce rate and pages-per-visit meaningful.
 */
function getSessionId(): string {
  try {
    const now = Date.now();
    const touched = Number(sessionStorage.getItem(SESSION_TOUCHED_KEY) ?? 0);
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && now - touched < SESSION_IDLE_MS) {
      sessionStorage.setItem(SESSION_TOUCHED_KEY, String(now));
      return existing;
    }
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${now}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, fresh);
    sessionStorage.setItem(SESSION_TOUCHED_KEY, String(now));
    return fresh;
  } catch {
    // Private mode, or storage blocked entirely. A per-page-load id still
    // records the view; it just cannot be grouped into a visit.
    return `nostore-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  const viewIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const maxScrollRef = useRef(0);
  // Visible time only. Counting wall-clock would report a tab left open in
  // the background all afternoon as a very engaged reader.
  const visibleMsRef = useRef(0);
  const lastResumeRef = useRef<number | null>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    // The dashboard is not the audience being measured.
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/preview")) return;

    let cancelled = false;
    viewIdRef.current = null;
    maxScrollRef.current = 0;
    visibleMsRef.current = 0;
    lastResumeRef.current = document.visibilityState === "visible" ? Date.now() : null;
    sentRef.current = false;

    const sessionId = getSessionId();
    sessionIdRef.current = sessionId;

    const url = pathname + window.location.search;

    fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "pageview",
        path: url,
        // Only an off-site referrer is meaningful here; within the site the
        // previous page is already recorded as its own view.
        referrer: document.referrer || null,
        sessionId,
      }),
      keepalive: true,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.id === "string") viewIdRef.current = data.id;
      })
      .catch(() => {
        // Never let a blocked request or an ad blocker surface anything.
      });

    const trackScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      // A page shorter than the viewport has nothing to scroll: the reader
      // has seen all of it, so that is 100 rather than a division by zero.
      const pct = scrollable <= 0 ? 100 : Math.round((window.scrollY / scrollable) * 100);
      const clamped = Math.max(0, Math.min(100, pct));
      if (clamped > maxScrollRef.current) maxScrollRef.current = clamped;
    };

    const accumulateVisible = () => {
      if (lastResumeRef.current != null) {
        visibleMsRef.current += Date.now() - lastResumeRef.current;
        lastResumeRef.current = null;
      }
    };

    const send = () => {
      if (sentRef.current) return;
      const viewId = viewIdRef.current;
      if (!viewId) return;
      accumulateVisible();
      sentRef.current = true;

      const payload = JSON.stringify({
        type: "engagement",
        viewId,
        sessionId,
        durationMs: visibleMsRef.current,
        scrollPct: maxScrollRef.current,
      });

      // sendBeacon is the only transport the browser guarantees to flush
      // during unload; fetch is the fallback for anything that lacks it.
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/analytics/collect", new Blob([payload], { type: "application/json" }));
          return;
        }
      } catch {
        // fall through
      }
      fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        accumulateVisible();
        // A backgrounded tab may never fire anything again, so this is
        // treated as the end of the read rather than a pause.
        send();
      } else if (lastResumeRef.current == null) {
        lastResumeRef.current = Date.now();
      }
    };

    trackScroll();
    window.addEventListener("scroll", trackScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", send);

    return () => {
      cancelled = true;
      // A client-side navigation away from this page ends the read too.
      send();
      window.removeEventListener("scroll", trackScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", send);
    };
  }, [pathname]);

  return null;
}
