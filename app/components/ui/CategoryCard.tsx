import Image from "next/image";
import Link from "next/link";
import { Clock, MessageSquare } from "lucide-react";
import type { Article } from "../../lib/articles";

// The card used inside a homepage category grid, and only there.
//
// Deliberately narrower than StoryCard: no kicker above the headline and no
// category chip, because the band's own header already says which section
// this is — repeating it on six cards under that header is noise. The meta
// row is read time and comments, nothing else: no dek, no byline, no date.
//
// Flat like StoryCard — square-ish corners, no shadow, no lift. Hover is the
// headline turning crimson and a 1.03 image nudge, nothing more.
export default function CategoryCard({
  article,
  commentCount,
  related,
}: {
  article: Article;
  /** Omitted when the article has no approved comments — the row then
      shows read time alone rather than a zero. */
  commentCount?: number;
  /** Up to two real follow-ups from the same section. Never padded: a card
      with nothing genuine to link renders no list at all. */
  related?: Article[];
}) {
  // The only "listen" signal this data has is the section itself. There is
  // no video flag on an article, so no WATCH pill is rendered — inventing
  // one would mean labelling stories as video that are not.
  const isListen = article.categorySlug === "podcasts";

  const follows = (related ?? []).slice(0, 2);

  return (
    <div>
      <Link href={`/articles/${article.slug}`} className="group block min-h-11">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2px] bg-[var(--color-bg-off)]">
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt={article.headline}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 460px"
            className="img-cinematic object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="img-placeholder absolute inset-0" />
        )}
        {isListen && (
          <span className="absolute left-0 top-0 bg-[var(--color-red)] px-2 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-white">
            Listen
          </span>
        )}
      </div>

      {/* 12px */}
      <h3 className="mt-3 font-headline text-[1.05rem] sm:text-[1.2rem] font-bold leading-[1.12] tracking-[-0.015em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-3">
        {article.headline}
      </h3>

      {/* 6px */}
      <div className="mt-1.5 flex items-center gap-3 font-sans text-[12px] text-[var(--color-gray-light)]">
        {article.readTime && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {article.readTime}
          </span>
        )}
        {typeof commentCount === "number" && commentCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            {commentCount}
            <span className="sr-only"> comments</span>
          </span>
        )}
        </div>
      </Link>

      {follows.length > 0 && (
        <ul className="mt-2 space-y-1">
          {follows.map((item) => (
            <li key={item.slug} className="flex gap-1.5">
              <span aria-hidden className="mt-[7px] h-[4px] w-[4px] shrink-0 rounded-full bg-[var(--color-red)]" />
              <Link
                href={`/articles/${item.slug}`}
                className="font-sans text-[13px] leading-[1.35] text-[var(--color-red-ink)] transition-colors hover:text-[var(--color-red-dark)] hover:underline line-clamp-2"
              >
                {item.headline}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
