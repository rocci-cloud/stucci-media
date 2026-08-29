import Image from "next/image";
import Link from "next/link";
import type { Article } from "./../lib/articles";

// The homepage's top story: photo left, headline right, nothing else.
//
// No dek, no byline, no date on the lead. The whole job of this block is to
// make one headline unmissable, and every additional line of type competes
// with it. The meta that a StoryCard carries is exactly what is dropped
// here on purpose.
//
// 58/42 on desktop, stacked on mobile with the photo full-bleed to the
// container edge and the headline underneath.
export default function LeadPackage({ article }: { article: Article }) {
  const kicker = article.kicker?.trim();

  return (
    <article className="border-b border-[var(--color-hairline)] pb-4 sm:pb-5">
      <Link href={`/articles/${article.slug}`} className="group grid grid-cols-1 gap-3 lg:grid-cols-[58fr_42fr] lg:gap-6 lg:items-center">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-bg-off)]">
          {article.coverImageUrl ? (
            <Image
              src={article.coverImageUrl}
              alt={article.headline}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 820px"
              className="img-cinematic object-cover transition-opacity duration-200 group-hover:opacity-[0.92]"
            />
          ) : (
            <div className="img-placeholder absolute inset-0" />
          )}
          {/* Overlay kicker: a solid crimson bar sitting on the photo,
              bottom-left. Only rendered when the desk actually wrote a
              kicker — falling back to the category here would put a label
              on every lead photo and turn a punch phrase into furniture. */}
          {kicker && (
            <span className="absolute bottom-0 left-0 bg-[var(--color-red)] px-3 py-1.5 font-headline text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.09em] text-white">
              {kicker}
            </span>
          )}
        </div>

        <h1 className="font-headline font-bold uppercase tracking-[-0.02em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-red-ink)] text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] leading-[0.98] line-clamp-3">
          {article.headline}
        </h1>
      </Link>
    </article>
  );
}
