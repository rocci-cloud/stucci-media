"use client";

import { useEffect, useState } from "react";
import { DESK_TIMEZONE } from "../lib/desk";

// The masthead's live Florida time.
//
// Renders nothing on the server and nothing on the first client paint. A
// clock is the textbook hydration mismatch — the server's second and the
// browser's second are never the same — and the usual fixes (a server
// timestamp, suppressHydrationWarning) both leave the page briefly showing
// a time that is wrong. The label beside it carries the meaning, so an
// empty slot for one frame costs nothing.
export default function LiveClock() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const format = () => {
      const now = new Date();
      const date = new Intl.DateTimeFormat("en-US", {
        timeZone: DESK_TIMEZONE,
        month: "short",
        day: "numeric",
      }).format(now);
      const time = new Intl.DateTimeFormat("en-US", {
        timeZone: DESK_TIMEZONE,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(now);
      return `${date} · ${time} ET`;
    };

    setNow(format());
    // Ticks on the minute rather than the second: the seconds are not
    // information anybody needs from a masthead, and a 1s interval is a
    // re-render every second for the life of the page.
    const id = window.setInterval(() => setNow(format()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span suppressHydrationWarning className="tabular-nums">
      {now ?? ""}
    </span>
  );
}
