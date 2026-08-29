import Image from "next/image";
import Link from "next/link";
import type { Article } from "../lib/articles";
import { timeAgo } from "../lib/time-ago";

// The article page's right rail. Five stories as thumb-left rows, then a
// standing listen box.
//
// The rail takes what it needs from the article list the page has already
// fetched — no extra query on the site's highest-traffic template. The
// listen box is a static link to /podcasts for the same reason: pulling
// the latest episode here would add a second query to every article view
// to fill a box that says "we have a show."
export default function ArticleRail({
  articles,
  excludeSlug,
  limit = 5,
}: {
  articles: Article[];
  excludeSlug: string;
  limit?: number;
}) {
  const items = articles.filter((a) => a.slug !== excludeSlug).slice(0, limit);

  return (
    <aside className="lg:sticky lg:top-16">
      <div className="mb-2.5 border-b border-[var(--color-red)] pb-1.5">
        <h2 className="font-headline text-[13px] font-bold uppercase leading-none tracking-[0.1em] text-[var(--color-text)]">
          More From Stucci Media
        </h2>
      </div>

      <ul>
        {items.map((a) => {
          const posted = timeAgo(a.publishedAt);
          return (
            <li key={a.slug} className="border-b border-[var(--color-hairline)] last:border-b-0">
              <Link href={`/articles/${a.slug}`} className="group flex min-h-11 gap-3 py-3">
                <div className="relative h-[80px] w-[120px] shrink-0 overflow-hidden rounded-[2px] bg-[var(--color-bg-off)]">
                  {a.coverImageUrl ? (
                    <Image
                      src={a.coverImageUrl}
                      alt={a.headline}
                      fill
                      sizes="120px"
                      className="img-cinematic object-cover transition-opacity duration-200 group-hover:opacity-[0.92]"
                    />
                  ) : (
                    <div className="img-placeholder absolute inset-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-headline text-[15px] font-bold leading-[1.15] tracking-[-0.01em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-3">
                    {a.headline}
                  </h3>
                  {posted && (
                    <div className="mt-1 font-sans text-[12px] text-[var(--color-gray-light)]">{posted}</div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-dark)] p-4">
        <span className="inline-flex items-center gap-1.5 font-sans text-[10.5px] font-bold uppercase tracking-[0.09em] text-white/70">
          <span className="inline-flex h-[7px] w-[7px] rounded-full bg-[var(--color-red)] [animation:livePip_2.4s_ease-in-out_infinite]" />
          On Air
        </span>
        <h3 className="mt-2 font-headline text-[19px] font-bold uppercase leading-[1.05] tracking-[-0.01em] text-white">
          The Rocci Stucci Show
        </h3>
        <p className="mt-1.5 font-sans text-[13px] leading-[1.45] text-white/70">
          Independent talk, five days a week — plus the full show network.
        </p>
        <Link
          href="/podcasts"
          className="mt-3 inline-flex min-h-11 items-center bg-[var(--color-red)] px-4 font-sans text-[12px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97]"
        >
          Listen Now
        </Link>
      </div>
    </aside>
  );
}
