import Image from "next/image";
import Link from "next/link";
import type { Article } from "../lib/articles";
import Badge from "./ui/Badge";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// The homepage's most important real estate: articles an editor has
// explicitly marked Featured (isFeatured + published), pulled straight —
// no "most recent" logic mixed in. If nothing is marked Featured yet, this
// falls back to the latest published stories so the homepage never shows
// a broken/empty first section, but is honest about it — no "Featured"
// badge on stories that weren't actually curated, and the header reads
// "Latest Stories" instead of "Featured Stories".
//
// Structural intent (see CLAUDE.md for the full rationale): this section
// renders its own full-bleed hero — it is NOT wrapped in the page's
// max-w-[1280px] container, unlike every other homepage module. The
// secondary editorial band below the hero re-applies that same max-width
// internally so it lines up with the rest of the page.
export default function FeaturedSection({
  featured,
  fallback,
}: {
  featured: Article[];
  fallback: Article[];
}) {
  const isFallback = featured.length === 0;
  const articles = isFallback ? fallback : featured;

  if (articles.length === 0) return null;

  const [lead, ...secondary] = articles;
  const secondaryItems = secondary.slice(0, 3);

  return (
    <section className="border-b-4 border-[var(--color-navy)]">
      {/* --- Full-bleed cinematic hero --- */}
      <Link
        href={`/articles/${lead.slug}`}
        className="group relative block w-full h-[85svh] min-h-[520px] max-h-[760px] sm:h-[72vh] sm:max-h-[680px] lg:h-[640px] lg:max-h-[74vh] overflow-hidden"
      >
        {lead.coverImageUrl ? (
          <Image
            src={lead.coverImageUrl}
            alt={lead.headline}
            fill
            priority
            sizes="100vw"
            className="img-cinematic object-cover [animation:heroImageReveal_1.1s_cubic-bezier(0.16,1,0.3,1)_both] transition-transform duration-[600ms] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="img-placeholder absolute inset-0 [animation:heroImageReveal_1.1s_cubic-bezier(0.16,1,0.3,1)_both]" />
        )}

        {/* Cinematic vignette: darkens the frame edges so the eye settles
            on the subject/headline instead of the corners — layered under
            the legibility scrim below, not a replacement for it. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.22)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/97 via-black/55 to-black/5" />

        <div className="absolute inset-x-0 bottom-0 px-4 pb-5 sm:px-8 sm:pb-9 lg:px-10 lg:pb-11">
          <div className="mx-auto max-w-[1280px] [animation:heroTextReveal_0.9s_cubic-bezier(0.16,1,0.3,1)_0.25s_both]">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="red">{lead.category}</Badge>
              {!isFallback && <Badge variant="onDark">Featured</Badge>}
            </div>
            <h1 className="font-headline text-white text-[36px] sm:text-[52px] lg:text-[66px] font-bold uppercase leading-[0.96] tracking-[-0.02em] mb-3 max-w-[16ch] sm:max-w-[20ch] group-hover:underline decoration-2 underline-offset-4">
              {lead.headline}
            </h1>
            <p className="text-white/85 text-[15.5px] sm:text-[18px] leading-[1.55] max-w-[58ch] mb-4 line-clamp-2 sm:line-clamp-2">
              {lead.dek}
            </p>
            <div className="flex items-center gap-2.5 font-sans text-[12px] sm:text-[13px] tracking-[0.01em] text-white/90">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-red)] text-[11px] font-bold text-white">
                {getInitials(lead.author)}
              </span>
              <span className="font-bold text-white">{lead.author}</span>
              <span className="opacity-50">·</span>
              <span>{lead.date}</span>
              <span className="opacity-50">·</span>
              <span>{lead.readTime}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* --- Tight editorial secondary system --- */}
      {secondaryItems.length > 0 && (
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="flex items-center gap-2.5 pt-3 pb-2.5 sm:pt-5 sm:pb-3.5">
            <span className="h-[9px] w-[9px] rounded-full bg-[var(--color-red)] shrink-0" />
            <h2 className="font-headline uppercase font-bold text-[14px] sm:text-[16px] tracking-[0.06em] leading-none text-[var(--color-gray)]">
              {isFallback ? "Latest Stories" : "Also Making Headlines"}
            </h2>
          </div>

          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 pb-4 sm:mx-0 sm:px-0 sm:pb-5 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible scrollbar-none">
            {secondaryItems.map((item, i) => (
              <Link
                key={item.slug}
                href={`/articles/${item.slug}`}
                className={`group shrink-0 w-[68%] snap-start sm:w-auto sm:shrink sm:border-t-2 sm:border-[var(--color-navy)] sm:pt-3.5 ${
                  i > 0 ? "sm:pl-6 sm:border-l sm:border-l-[var(--color-hairline)]" : ""
                }`}
              >
                <div className="relative mb-2.5 aspect-[2/1] sm:aspect-[16/9] overflow-hidden">
                  {item.coverImageUrl ? (
                    <Image
                      src={item.coverImageUrl}
                      alt={item.headline}
                      fill
                      sizes="(max-width: 640px) 68vw, 400px"
                      className="img-cinematic object-cover transition-transform duration-[600ms] group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="img-placeholder absolute inset-0" />
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/12 to-transparent" />
                </div>
                <Badge variant="text" className="mb-1.5">
                  {item.category}
                </Badge>
                <div className="font-headline text-[17px] sm:text-[18px] font-bold leading-[1.15] tracking-[-0.01em] mb-1.5 line-clamp-2 group-hover:text-[var(--color-red-ink)] transition-colors">
                  {item.headline}
                </div>
                <div className="flex flex-wrap items-center gap-x-1.5 font-sans text-[11px] tracking-[0.01em] text-[var(--color-gray-light)]">
                  <span className="font-bold text-[var(--color-text)]">{item.author}</span>
                  <span>·</span>
                  <span>{item.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
