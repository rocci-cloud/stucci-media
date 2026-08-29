import Image from "next/image";
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
    "group flex min-h-11 gap-3 border border-[var(--color-hairline)] p-3 transition-colors hover:border-[var(--color-red)]";

  const thumb = (article: Article) => (
    <div className="relative h-[64px] w-[96px] shrink-0 overflow-hidden rounded-[2px] bg-[var(--color-bg-off)]">
      {article.coverImageUrl ? (
        <Image
          src={article.coverImageUrl}
          alt=""
          fill
          sizes="96px"
          className="img-cinematic object-cover transition-opacity duration-200 group-hover:opacity-[0.92]"
        />
      ) : (
        <div className="img-placeholder absolute inset-0" />
      )}
    </div>
  );

  return (
    <nav aria-label="More stories" className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {previous ? (
        <Link href={`/articles/${previous.slug}`} className={cell}>
          {thumb(previous)}
          <span className="flex min-w-0 flex-col justify-center">
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-red-ink)]">
              ← Previous
            </span>
            <span className="mt-1 font-headline text-[15px] font-bold leading-[1.15] tracking-[-0.01em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-2">
              {previous.headline}
            </span>
          </span>
        </Link>
      ) : (
        <span aria-hidden />
      )}
      {next && (
        <Link href={`/articles/${next.slug}`} className={`${cell} sm:flex-row-reverse sm:text-right`}>
          {thumb(next)}
          <span className="flex min-w-0 flex-col justify-center">
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-red-ink)]">
              Next →
            </span>
            <span className="mt-1 font-headline text-[15px] font-bold leading-[1.15] tracking-[-0.01em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-2">
              {next.headline}
            </span>
          </span>
        </Link>
      )}
    </nav>
  );
}
