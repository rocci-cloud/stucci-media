"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, Maximize2, Trash2 } from "lucide-react";
import { cn } from "../../lib/cn";

const ALIGNMENTS = [
  { value: "left", icon: AlignLeft, label: "Align left" },
  { value: "center", icon: AlignCenter, label: "Align center" },
  { value: "right", icon: AlignRight, label: "Align right" },
  { value: "full", icon: Maximize2, label: "Full width" },
] as const;

const MIN_WIDTH_PERCENT = 20;

export default function FigureImageView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { src, alt, caption, align, width } = node.attrs as {
    src: string;
    alt: string;
    caption: string;
    align: "left" | "center" | "right" | "full";
    width: number | null;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  // Drag-to-resize. Width is stored as a percentage of the editor column
  // rather than pixels so the same article renders sensibly at any
  // viewport width on the public site — a pixel width authored on a wide
  // desktop would overflow on a phone.
  const startResize = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const containerWidth = container.getBoundingClientRect().width;
      if (containerWidth <= 0) return;

      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);

      let latest = width ?? 100;

      const onMove = (moveEvent: PointerEvent) => {
        const left = container.getBoundingClientRect().left;
        const raw = ((moveEvent.clientX - left) / containerWidth) * 100;
        latest = Math.round(Math.min(100, Math.max(MIN_WIDTH_PERCENT, raw)));
        setDragWidth(latest);
      };
      const onUp = () => {
        handle.releasePointerCapture(event.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setDragWidth(null);
        updateAttributes({ width: latest });
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [updateAttributes, width]
  );

  const effectiveWidth = dragWidth ?? width;

  // Keep the caption input in sync when the node's attrs change from
  // elsewhere (undo, a collaborative-style external update) without
  // fighting the user's own typing.
  const [captionDraft, setCaptionDraft] = useState(caption ?? "");
  useEffect(() => {
    setCaptionDraft(caption ?? "");
  }, [caption]);

  return (
    <NodeViewWrapper
      className={cn(
        "group relative my-4",
        align === "left" && "flex justify-start",
        align === "center" && "flex justify-center",
        align === "right" && "flex justify-end",
        align === "full" && "block"
      )}
    >
      <div
        ref={containerRef}
        className={cn("relative w-full", align !== "full" && "max-w-full")}
        style={effectiveWidth ? { width: `${effectiveWidth}%` } : undefined}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-md border transition-colors",
            selected ? "border-[var(--admin-primary)]" : "border-transparent"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt || ""} className="block w-full" draggable={false} />

          {/* Resize handle — only meaningful when the image isn't already
              pinned to the full column. */}
          {align !== "full" && (
            <button
              type="button"
              aria-label="Resize image"
              onPointerDown={startResize}
              className="absolute top-1/2 right-0 h-12 w-3 -translate-y-1/2 cursor-ew-resize rounded-l bg-[var(--admin-primary)] opacity-0 transition-opacity group-hover:opacity-100"
            />
          )}

          {dragWidth !== null && (
            <span className="absolute top-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
              {dragWidth}%
            </span>
          )}
        </div>

        {/* Floating controls — hidden until hover/selection so they don't
            compete with the writing surface. */}
        <div
          className={cn(
            "absolute top-2 left-2 flex items-center gap-0.5 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] p-0.5 shadow-sm transition-opacity",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          contentEditable={false}
        >
          {ALIGNMENTS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={align === value}
              onClick={() => updateAttributes({ align: value, ...(value === "full" ? { width: null } : {}) })}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-[var(--admin-bg-subtle)]",
                align === value && "bg-[var(--admin-bg-subtle)] text-[var(--admin-primary)]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <span className="mx-0.5 h-4 w-px bg-[var(--admin-border)]" />
          <button
            type="button"
            title="Remove image"
            aria-label="Remove image"
            onClick={deleteNode}
            className="flex h-7 w-7 items-center justify-center rounded text-[var(--admin-danger)] transition-colors hover:bg-[var(--admin-danger-bg)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <input
          value={captionDraft}
          onChange={(e) => setCaptionDraft(e.target.value)}
          onBlur={() => updateAttributes({ caption: captionDraft.trim() })}
          placeholder="Add a caption…"
          contentEditable={false}
          className="mt-1.5 w-full border-none bg-transparent text-center text-[13px] text-[var(--admin-fg-muted)] italic outline-none placeholder:not-italic focus:text-[var(--admin-fg)]"
        />

        {!alt && (
          <p className="mt-0.5 text-center text-[11px] text-[var(--admin-danger)]">
            No alt text — set it in the Media Library or re-insert this image.
          </p>
        )}
      </div>
    </NodeViewWrapper>
  );
}
