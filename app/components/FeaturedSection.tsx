import Link from "next/link";
import type { Article } from "../lib/articles";
import ArticleCard from "./ui/ArticleCard";
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
    <section className="pb-8 sm:pb-10 border-b-4 border-[var(--color-navy)]">
      <div className="flex items-center gap-2.5 mb-5 sm:mb-6">
        <span className="h-[10px] w-[10px] rounded-full bg-[var(--color-red)] shrink-0" />
        <h2 className="font-headline uppercase font-bold text-[22px] sm:text-[28px] tracking-[-0.01em] leading-none">
          {isFallback ? "Latest Stories" : "Featured Stories"}
        </h2>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 lg:gap-8 ${
          secondaryItems.length > 0 ? "lg:grid-cols-[2fr_1fr]" : ""
        }`}
      >
        <Link
          href={`/articles/${lead.slug}`}
          className="group relative block -mx-5 sm:mx-0 aspect-[4/5] sm:aspect-[16/9] overflow-hidden sm:rounded-card sm:shadow-card"
        >
          {lead.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lead.coverImageUrl}
              alt={lead.headline}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 bg-[#E5E4E0]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/5 sm:from-black/85 sm:via-black/25 sm:to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="red">{lead.category}</Badge>
              {!isFallback && <Badge variant="navy">Featured</Badge>}
            </div>
            <h3 className="font-headline text-white text-[27px] sm:text-[38px] lg:text-[44px] font-bold uppercase leading-[1.05] tracking-[-0.01em] mb-2.5 group-hover:underline decoration-2 underline-offset-4">
              {lead.headline}
            </h3>
            <p className="text-white/85 text-[14.5px] sm:text-[16.5px] leading-[1.5] max-w-[58ch] mb-4 line-clamp-2 sm:line-clamp-3">
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
        </Link>

        {secondaryItems.length > 0 && (
          <div className="flex flex-col gap-3.5">
            {secondaryItems.map((item) => (
              <ArticleCard key={item.slug} article={item} variant="featured" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
