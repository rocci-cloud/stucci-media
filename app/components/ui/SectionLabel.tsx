import Link from "next/link";

// Small uppercase label over a thin crimson rule. Deliberately lighter
// than SectionHeader (which carries a 5px bar and larger type): a river of
// cards wants a quiet divider between blocks, not a masthead above each
// one.
export default function SectionLabel({
  title,
  href,
  className = "",
}: {
  title: string;
  href?: string;
  className?: string;
}) {
  return (
    <div className={`mb-2.5 border-b border-[var(--color-red)] pb-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-headline text-[13px] sm:text-[14px] font-bold uppercase leading-none tracking-[0.1em] text-[var(--color-text)]">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-red-ink)] transition-colors hover:text-[var(--color-red-dark)]"
          >
            More →
          </Link>
        )}
      </div>
    </div>
  );
}
