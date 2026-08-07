import Link from "next/link";
import type { Article } from "../lib/articles";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";
import Badge from "./ui/Badge";

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
        <Badge variant="red" className="mb-2.5">
          {lead.category}
        </Badge>
        {lead.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lead.coverImageUrl}
            alt={lead.headline}
            className="w-full aspect-video object-cover rounded-card shadow-card mb-4"
          />
        ) : (
          <div className="w-full aspect-video bg-[#E5E4E0] rounded-card mb-4" />
        )}
        <h1 className="font-headline text-[28px] sm:text-[38px] font-bold uppercase leading-[1.05] tracking-[-0.005em] mb-3 group-hover:text-[var(--color-red)] transition-colors">
          {lead.headline}
        </h1>
        <p className="text-[16px] sm:text-[17px] leading-[1.55] text-[#333] max-w-[60ch] mb-3">
          {lead.dek}
        </p>
        <div className="font-sans text-[12.5px] text-[var(--color-gray)]">
          By <b className="text-[var(--color-text)]">{lead.author}</b> · {lead.date} · {lead.readTime}
        </div>
      </Link>

      <aside className="flex flex-col rounded-card overflow-hidden border border-[var(--color-hairline)] shadow-card">
        <SectionHeader title="Also Developing" variant="panel" />
        <div className="divide-y divide-[var(--color-hairline)] bg-white">
          {rail.map((item) => (
            <ArticleCard key={item.slug} article={item} variant="list" />
          ))}
        </div>
      </aside>
    </section>
  );
}
