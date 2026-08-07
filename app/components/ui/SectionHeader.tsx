import Link from "next/link";

type SectionHeaderProps = {
  title: string;
  href?: string;
  linkLabel?: string;
  variant?: "underline" | "panel";
  className?: string;
};

// Shared section-title patterns used across the site: "underline" is the
// kicker-style header above article grids/rails; "panel" is the solid
// navy bar used atop sidebar/rail panels (Trending Now, Also Developing).
// Keeping both here means every module's heading treatment stays
// pixel-identical instead of drifting component to component.
export default function SectionHeader({
  title,
  href,
  linkLabel = "More",
  variant = "underline",
  className = "",
}: SectionHeaderProps) {
  if (variant === "panel") {
    return (
      <div
        className={`bg-[var(--color-navy)] text-white font-headline uppercase font-bold text-[15px] tracking-wide px-4 py-2.5 ${className}`}
      >
        {title}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 mb-4 sm:mb-5 ${className}`}>
      <h2 className="font-headline uppercase font-bold text-[19px] sm:text-[21px] tracking-[-0.005em] border-l-4 border-[var(--color-red)] pl-3 leading-none">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 min-h-11 flex items-center font-sans text-[11.5px] font-bold uppercase text-[var(--color-red)] hover:text-[var(--color-red-dark)] transition-colors whitespace-nowrap"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
