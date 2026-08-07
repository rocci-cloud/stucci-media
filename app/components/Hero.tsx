import Link from "next/link";
import type { Article } from "../lib/articles";

export default function Hero({
  lead,
  rail,
}: {
  lead: Article;
  rail: Article[];
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-7 md:gap-8 pb-8 border-b border-[var(--color-hairline)]">
      <Link href={`/articles/${lead.slug}`} className="block group">
        <span className="font-sans block text-xs font-bold uppercase tracking-wide text-[var(--color-red)] mb-2.5">
          {lead.category}
        </span>
        {lead.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lead.coverImageUrl}
            alt={lead.headline}
            className="w-full aspect-video object-cover border border-[var(--color-hairline)] mb-4"
          />
        ) : (
          <div className="w-full aspect-video bg-[#E5E4E0] border border-[var(--color-hairline)] mb-4" />
        )}
        <h1 className="font-headline text-[28px] sm:text-[38px] font-bold uppercase leading-[1.05] tracking-[-0.005em] mb-3 group-hover:text-[var(--color-red)]">
          {lead.headline}
        </h1>
        <p className="text-[16px] sm:text-[17px] leading-[1.55] text-[#333] max-w-[60ch] mb-3">
          {lead.dek}
        </p>
        <div className="font-sans text-[12.5px] text-[var(--color-gray)]">
          By <b className="text-[var(--color-text)]">{lead.author}</b> · {lead.date} · {lead.readTime}
        </div>
      </Link>

      <aside className="flex flex-col">
        <div className="bg-[var(--color-black)] text-white font-headline uppercase font-bold text-[15px] tracking-wide px-4 py-2.5 mb-0">
          Also Developing
        </div>
        <div className="divide-y divide-[var(--color-hairline)] border border-t-0 border-[var(--color-hairline)]">
          {rail.map((item) => (
            <Link key={item.slug} href={`/articles/${item.slug}`} className="flex gap-3 px-3.5 py-3 group">
              {item.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.coverImageUrl}
                  alt={item.headline}
                  className="w-[76px] h-[58px] object-cover border border-[var(--color-hairline)] shrink-0"
                />
              ) : (
                <div className="w-[76px] h-[58px] bg-[#E5E4E0] border border-[var(--color-hairline)] shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-headline text-[14.5px] font-bold leading-[1.25] group-hover:text-[var(--color-red)] line-clamp-3">
                  {item.headline}
                </div>
                <div className="font-sans text-[11px] text-[var(--color-gray-light)] mt-1">{item.date}</div>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </section>
  );
}
