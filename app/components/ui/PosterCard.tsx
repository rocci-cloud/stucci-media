import Image from "next/image";
import Link from "next/link";
import type { Article } from "../../lib/articles";

type PosterSize = "lead" | "stack" | "rail" | "compact";

// The density engine for the homepage.
//
// `ArticleCard` is a *card*: a white panel with the image on top and the
// copy underneath, which is the right shape for a reading page. This is a
// *poster*: the image is the block, and the copy sits on it. That is what
// lets a homepage module be mostly picture at every size without turning
// into rows of chrome — and it is why the homepage now uses this while
// category and article pages keep ArticleCard unchanged.
//
// Every size shares one scrim recipe so a lead and a rail tile read as the
// same object at different scales, rather than four bespoke treatments.

const FRAME: Record<PosterSize, string> = {
  lead: "aspect-[4/5] sm:aspect-[16/10] lg:aspect-[3/2]",
  stack: "aspect-[16/9] sm:aspect-[2/1] lg:aspect-[16/9]",
  rail: "aspect-[16/9]",
  compact: "aspect-[16/9]",
};

const HEADLINE: Record<PosterSize, string> = {
  lead: "text-[26px] sm:text-[36px] lg:text-[42px] leading-[0.98] tracking-[-0.02em]",
  stack: "text-[19px] sm:text-[23px] leading-[1.03] tracking-[-0.015em]",
  rail: "text-[16px] sm:text-[17px] leading-[1.08] tracking-[-0.01em]",
  compact: "text-[15px] sm:text-[16px] leading-[1.1] tracking-[-0.01em]",
};

const PAD: Record<PosterSize, string> = {
  lead: "p-4 sm:p-6",
  stack: "p-3.5 sm:p-4",
  rail: "p-3 sm:p-3.5",
  compact: "p-3",
};

/** Veterans is the one section with its own accent — gold, and only here. */
function kickerClass(categorySlug: string) {
  return categorySlug === "veterans"
    ? "text-[var(--color-gold)]"
    : "text-white";
}

export default function PosterCard({
  article,
  size = "rail",
  priority = false,
  showDek = false,
  className = "",
}: {
  article: Article;
  size?: PosterSize;
  /** Only ever true for a genuine LCP candidate — see HeroRotator. */
  priority?: boolean;
  showDek?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className={`group relative block overflow-hidden bg-[var(--color-navy-dark)] ${FRAME[size]} ${className}`}
    >
      {article.coverImageUrl ? (
        <Image
          src={article.coverImageUrl}
          alt={article.headline}
          fill
          priority={priority}
          sizes={
            size === "lead"
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 860px"
              : size === "stack"
                ? "(max-width: 640px) 100vw, 40vw, 560px"
                : "(max-width: 640px) 50vw, 360px"
          }
          className="img-cinematic ken-burns transform-gpu object-cover"
        />
      ) : (
        <div className="img-placeholder absolute inset-0" />
      )}

      {/* One scrim recipe at every size: a heavy foot for the copy, a light
          vignette so the frame edges settle. Tuned against the night desk's
          near-black page ground, where a weak scrim leaves a poster looking
          like it is floating with no base. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.28)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/92 via-black/40 to-transparent" />

      <div className={`absolute inset-x-0 bottom-0 ${PAD[size]}`}>
        <div
          className={`mb-1.5 font-sans text-[10.5px] font-bold uppercase tracking-[0.09em] ${kickerClass(
            article.categorySlug,
          )}`}
        >
          {article.isExclusive ? "Exclusive · " : ""}
          {article.category}
        </div>
        <h3
          className={`font-headline font-bold uppercase text-white ${HEADLINE[size]} group-hover:underline decoration-2 underline-offset-[6px]`}
        >
          {article.headline}
        </h3>
        {showDek && article.dek && (
          <p className="mt-2 max-w-[52ch] font-sans text-[14px] sm:text-[15px] leading-[1.5] text-white/80 line-clamp-2">
            {article.dek}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 font-sans text-[11px] tracking-[0.02em] text-white/70">
          <span className="font-bold text-white/90">{article.author}</span>
          <span aria-hidden>·</span>
          <span>{article.date}</span>
        </div>
      </div>
    </Link>
  );
}
