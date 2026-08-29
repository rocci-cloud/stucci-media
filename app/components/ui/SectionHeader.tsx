import Link from "next/link";

type SectionHeaderProps = {
  title: string;
  href?: string;
  linkLabel?: string;
  variant?: "underline" | "panel";
  compact?: boolean;
  className?: string;
};

// Shared section-title patterns used across the site: "underline" is the
// kicker-style header above article grids/rails; "panel" is the solid
// navy bar used atop sidebar/rail panels (Trending Now, Also Developing).
// Keeping both here means every module's heading treatment stays
// pixel-identical instead of drifting component to component.
//
// `compact` is opt-in (default off) so a page stacking several modules
// can run a tighter kicker without changing RelatedArticles/ArticleGrid's
// existing spacing on article/category pages.
export default function SectionHeader({
  title,
  href,
  linkLabel = "View All",
  variant = "underline",
  compact = false,
  className = "",
}: SectionHeaderProps) {
  if (variant === "panel") {
    return (
      <div
        className={`bg-[var(--color-navy)] text-white font-headline uppercase font-bold text-[14.5px] tracking-[0.03em] border-l-4 border-[var(--color-red)] pl-3.5 pr-4 py-3 ${className}`}
      >
        {title}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 ${compact ? "mb-2 sm:mb-3" : "mb-4 sm:mb-5"} ${className}`}
    >
      <h2
        className={`font-headline uppercase font-bold ${compact ? "text-[16px] sm:text-[18px]" : "text-[20px] sm:text-[23px]"} tracking-[-0.015em] border-l-[5px] border-[var(--color-red)] pl-3.5 leading-none`}
      >
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 min-h-11 inline-flex items-center gap-1 font-sans text-[11.5px] font-bold uppercase text-[var(--color-red-ink)] border border-[var(--color-red)] rounded-control px-3.5 hover:bg-[var(--color-red)] hover:text-white active:bg-[var(--color-red-dark)] active:border-[var(--color-red-dark)] active:text-white transition-colors whitespace-nowrap"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
