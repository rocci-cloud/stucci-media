type BadgeProps = {
  children: React.ReactNode;
  variant?: "red" | "navy" | "text";
  className?: string;
};

// `red`/`navy` are solid attention-grabbing tags (BREAKING, FEATURED,
// LIVE) — sized and weighted to read as a real tag, not a faint label.
// `text` is the quiet category kicker used above most headlines; a small
// dot marker gives it graphic presence without the weight of a filled
// pill, so the hierarchy between "this is a loud tag" and "this is a
// quiet category label" is visual, not just a color difference.
const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  red: "bg-[var(--color-red)] text-white text-[11px] px-2.5 py-1 rounded-[4px]",
  navy: "bg-[var(--color-navy)] text-white text-[11px] px-2.5 py-1 rounded-[4px]",
  text: "text-[var(--color-red)] text-[10.5px] px-0 py-0",
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
