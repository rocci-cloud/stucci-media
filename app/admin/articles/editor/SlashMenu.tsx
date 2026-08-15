"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";
import type { SlashPopupState } from "./extensions/SlashCommand";

const MENU_WIDTH = 288;
const MENU_MAX_HEIGHT = 320;
const GAP = 6;

/**
 * The "/" command palette inside the editor.
 *
 * Rendered in a portal and positioned from the caret's client rect rather
 * than nested in the editor's DOM: the editor sits inside a scrolling,
 * overflow-hidden card, and an absolutely-positioned menu inside it gets
 * clipped at the card's edge for anything near the bottom of a long
 * article.
 */
export default function SlashMenu({
  state,
  onSelect,
}: {
  state: SlashPopupState | null;
  onSelect: (index: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Keep the highlighted item visible while arrowing through a filtered
  // list that's longer than the menu.
  useLayoutEffect(() => {
    if (!state) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [state]);

  if (!mounted || !state || state.items.length === 0) return null;

  // Flip above the caret when there isn't room below.
  const spaceBelow = window.innerHeight - state.rect.bottom;
  const flip = spaceBelow < MENU_MAX_HEIGHT + GAP && state.rect.top > MENU_MAX_HEIGHT;
  const top = flip ? state.rect.top - GAP : state.rect.bottom + GAP;
  const left = Math.min(state.rect.left, window.innerWidth - MENU_WIDTH - 12);

  let lastGroup = "";

  return createPortal(
    <div
      role="listbox"
      aria-label="Insert block"
      style={{
        position: "fixed",
        top,
        left: Math.max(12, left),
        width: MENU_WIDTH,
        maxHeight: MENU_MAX_HEIGHT,
        transform: flip ? "translateY(-100%)" : undefined,
      }}
      className="z-50 overflow-y-auto rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1 shadow-lg"
      ref={listRef}
    >
      {state.items.map((item, index) => {
        const showGroup = item.group !== lastGroup;
        lastGroup = item.group;
        const active = index === state.index;
        return (
          <div key={item.id}>
            {showGroup && (
              <div className="px-2 pt-2 pb-1 text-[10.5px] font-semibold tracking-[0.06em] text-[var(--admin-fg-muted)] uppercase">
                {item.group}
              </div>
            )}
            <button
              type="button"
              role="option"
              aria-selected={active}
              data-active={active}
              // onMouseDown, not onClick: clicking would blur the editor
              // first, collapsing the selection the command needs.
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(index);
              }}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors",
                active ? "bg-[var(--admin-bg-subtle)]" : "hover:bg-[var(--admin-bg-subtle)]/60"
              )}
            >
              <span className="text-[13px] font-medium text-[var(--admin-fg)]">{item.title}</span>
              <span className="text-[11.5px] text-[var(--admin-fg-muted)]">{item.hint}</span>
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
