type BadgeProps = {
  children: React.ReactNode;
  variant?: "red" | "navy" | "text";
  className?: string;
};

const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  red: "bg-[var(--color-red)] text-white px-2 py-[3px] rounded-[3px]",
  navy: "bg-[var(--color-navy)] text-white px-2 py-[3px] rounded-[3px]",
  text: "text-[var(--color-red)] px-0 py-0",
};

// Shared kicker/tag styling — category labels, "BREAKING", "LIVE", etc.
// `variant="text"` is the plain colored-uppercase kicker used above most
// headlines; `red`/`navy` are solid pill tags for attention-grabbing labels.
export default function Badge({ children, variant = "text", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-sans font-bold text-[10.5px] uppercase tracking-[0.05em] leading-none ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
