"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { DESK_ATTRIBUTE, DESK_STORAGE_KEY, type Desk } from "../lib/desk";

// Manual override for the day/night desk. The inline script in layout.tsx
// has already set the attribute by the time this mounts, so this reads the
// live DOM rather than re-deriving the hour — two sources for the same
// answer is how they drift apart.
export default function DeskToggle() {
  const [desk, setDesk] = useState<Desk | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute(DESK_ATTRIBUTE);
    setDesk(current === "night" ? "night" : "day");
  }, []);

  function toggle() {
    const next: Desk = desk === "night" ? "day" : "night";
    setDesk(next);
    document.documentElement.setAttribute(DESK_ATTRIBUTE, next);
    try {
      window.localStorage.setItem(DESK_STORAGE_KEY, next);
    } catch {
      // Private mode, or storage disabled. The toggle still works for this
      // page view; it just will not be remembered, which is a better
      // outcome than the click doing nothing.
    }
  }

  // Until the effect runs there is no honest answer to "which desk is on",
  // and rendering a guess means a wrong icon on first paint. The button
  // holds its footprint so the masthead does not shift when it resolves.
  const label =
    desk === null
      ? "Switch theme"
      : desk === "night"
        ? "Switch to day desk"
        : "Switch to night desk";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center text-[var(--color-gray)] transition-colors hover:text-[var(--color-red-ink)]"
    >
      {desk === "night" ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden={desk === null} />
      )}
    </button>
  );
}
