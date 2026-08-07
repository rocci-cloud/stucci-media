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
    <section className="mx-auto max-w-[1200px] px-5 pt-7 pb-9 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-7 md:gap-10">
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
        <h1 className="font-headline text-[27px] sm:text-[38px] font-bold leading-[1.1] tracking-[-0.01em] mb-3 group-hover:underline">
          {lead.headline}
        </h1>
        <p className="text-[16px] sm:text-[17px] leading-[1.55] text-[#333] max-w-[60ch] mb-3">
          {lead.dek}
        </p>
        <div className="font-sans text-[12.5px] text-[var(--color-gray)]">
          By <b className="text-[var(--color-text)]">{lead.author}</b> · {lead.date} · {lead.readTime}
        </div>
      </Link>

      <aside className="border-t-2 md:border-t-0 md:border-l border-[var(--color-hairline-strong)] md:border-l-[var(--color-hairline)] pt-5 md:pt-0 md:pl-8">
        <div className="font-sans text-xs font-bold uppercase tracking-wide text-[var(--color-gray)] pb-2.5 border-b-2 border-[var(--color-hairline-strong)] mb-1">
          Also Developing
        </div>
        {rail.map((item, i) => (
          <Link
            key={item.slug}
            href={`/articles/${item.slug}`}
            className={`block py-4 group ${i < rail.length - 1 ? "border-b border-[var(--color-hairline)]" : ""}`}
          >
            <div className="font-headline text-[17px] font-bold leading-[1.3] mb-1.5 group-hover:underline">
              {item.headline}
            </div>
            <div className="font-sans text-[11.5px] text-[var(--color-gray-light)]">{item.date}</div>
          </Link>
        ))}
      </aside>
    </section>
  );
}
