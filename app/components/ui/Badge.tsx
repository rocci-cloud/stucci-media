type BadgeProps = {
  children: React.ReactNode;
  variant?: "red" | "navy" | "onDark" | "text";
  className?: string;
};

// `red`/`navy` are solid attention-grabbing tags (BREAKING, FEATURED,
// LIVE) — sized and weighted to read as a real tag, not a faint label.
// `onDark` is the same tag for the one place navy can't go: over a hero
// photograph. The heroes lay a near-black scrim over the image, so a navy
// pill dissolves into it and the label reads as bare floating white text
// with no tag shape at all. Inverting to a white fill keeps the tag
// legible over any photograph, dark or light.
// `text` is the quiet category kicker used above most headlines; a small
// dot marker gives it graphic presence without the weight of a filled
// pill, so the hierarchy between "this is a loud tag" and "this is a
// quiet category label" is visual, not just a color difference.
const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  red: "bg-[var(--color-red)] text-white text-[11px] px-2.5 py-1 rounded-[4px]",
  navy: "bg-[var(--color-navy)] text-white text-[11px] px-2.5 py-1 rounded-[4px]",
  onDark: "bg-white text-[var(--color-navy)] text-[11px] px-2.5 py-1 rounded-[4px]",
  text: "text-[var(--color-red-ink)] text-[10.5px] px-0 py-0",
};

export default function Badge({ children, variant = "text", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-bold uppercase tracking-[0.05em] leading-none ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {variant === "text" && <span className="h-[4px] w-[4px] shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}
