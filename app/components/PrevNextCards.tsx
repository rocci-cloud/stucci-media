import Link from "next/link";
import type { Article } from "../lib/articles";

// Previous/next, as two compact rows rather than a full-width magazine
// closer. Derived by position in the list the page already has, so this
// costs no extra query.
export default function PrevNextCards({
  previous,
  next,
}: {
  previous?: Article;
  next?: Article;
}) {
  if (!previous && !next) return null;

  const cell =
    "group flex min-h-11 flex-col justify-center border border-[var(--color-hairline)] p-4 transition-colors hover:border-[var(--color-red)]";

  return (
    <nav aria-label="More stories" className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {previous ? (
        <Link href={`/articles/${previous.slug}`} className={cell}>
          <span className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-red-ink)]">
            ← Previous
          </span>
          <span className="mt-1.5 font-headline text-[16px] font-bold leading-[1.15] tracking-[-0.01em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-2">
            {previous.headline}
          </span>
        </Link>
      ) : (
        <span aria-hidden />
      )}
      {next && (
        <Link href={`/articles/${next.slug}`} className={`${cell} sm:text-right`}>
          <span className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-red-ink)]">
            Next →
          </span>
          <span className="mt-1.5 font-headline text-[16px] font-bold leading-[1.15] tracking-[-0.01em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-2">
            {next.headline}
          </span>
        </Link>
      )}
    </nav>
  );
}
