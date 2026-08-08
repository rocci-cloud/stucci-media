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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lead.coverImageUrl}
            alt={lead.headline}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 bg-[#E5E4E0]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-8 sm:pb-9 lg:px-10 lg:pb-11">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="red">{lead.category}</Badge>
              {!isFallback && <Badge variant="navy">Featured</Badge>}
            </div>
            <h1 className="font-headline text-white text-[32px] sm:text-[46px] lg:text-[58px] font-bold uppercase leading-[1.02] tracking-[-0.015em] mb-3 max-w-[16ch] sm:max-w-[20ch] group-hover:underline decoration-2 underline-offset-4">
              {lead.headline}
            </h1>
            <p className="text-white/85 text-[15px] sm:text-[17px] leading-[1.5] max-w-[58ch] mb-4 line-clamp-2 sm:line-clamp-2">
              {lead.dek}
            </p>
            <div className="flex items-center gap-2.5 font-sans text-[12px] sm:text-[13px] text-white/90">
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
          <div className="flex items-center gap-2.5 pt-4 pb-3 sm:pt-5 sm:pb-3.5">
            <span className="h-[9px] w-[9px] rounded-full bg-[var(--color-red)] shrink-0" />
            <h2 className="font-headline uppercase font-bold text-[15px] sm:text-[17px] tracking-[0.02em] leading-none text-[var(--color-gray)]">
              {isFallback ? "Latest Stories" : "Also Making Headlines"}
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 pb-4 sm:mx-0 sm:px-0 sm:pb-5 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible scrollbar-none">
            {secondaryItems.map((item, i) => (
              <Link
                key={item.slug}
                href={`/articles/${item.slug}`}
                className={`group shrink-0 w-[68%] snap-start sm:w-auto sm:shrink sm:border-t-2 sm:border-[var(--color-navy)] sm:pt-3.5 ${
                  i > 0 ? "sm:pl-6 sm:border-l sm:border-l-[var(--color-hairline)]" : ""
                }`}
              >
                {item.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverImageUrl}
                    alt={item.headline}
                    className="w-full aspect-[4/3] object-cover mb-2.5"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-[#E5E4E0] mb-2.5" />
                )}
                <Badge variant="text" className="mb-1.5">
                  {item.category}
                </Badge>
                <div className="font-headline text-[16px] sm:text-[17px] font-bold leading-[1.2] mb-1.5 line-clamp-2 group-hover:text-[var(--color-red)] transition-colors">
                  {item.headline}
                </div>
                <div className="flex flex-wrap items-center gap-x-1.5 font-sans text-[11px] text-[var(--color-gray-light)]">
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
