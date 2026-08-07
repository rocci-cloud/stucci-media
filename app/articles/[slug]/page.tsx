import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Sidebar from "../../components/Sidebar";
import { getArticleBySlug, getPublishedArticles } from "../../lib/articles";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

// --- THIS is the fix for the Base44/Lovable social-share bug ---
// This function runs on the SERVER, per article, before the page
// is ever sent to a browser or a crawler. Facebook/Twitter/iMessage
// bots read exactly what this returns — the real headline, the real
// dek, and (once real photos exist) the real cover image. That's why
// this had to be a Next.js/SSR app and not a client-rendered SPA.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const image = article.coverImageUrl ?? "/og-default.png";

  return {
    title: article.headline,
    description: article.dek,
    openGraph: {
      title: article.headline,
      description: article.dek,
      type: "article",
      publishedTime: article.date,
      authors: [article.author],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: article.headline,
      description: article.dek,
      images: [image],
    },
  };
}

export async function generateStaticParams() {
  // If the DB isn't reachable at build time, fall back to rendering
  // every article on-demand instead of failing the whole build.
  try {
    const articles = await getPublishedArticles();
    return articles.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [article, allArticles] = await Promise.all([getArticleBySlug(slug), getPublishedArticles()]);
  if (!article) notFound();

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-5 pt-8 pb-18 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
        <article className="max-w-[720px]">
          <Link
            href="/"
            className="font-sans text-[13px] text-[var(--color-gray)] hover:text-[var(--color-text)] hover:underline mb-6 inline-block"
          >
            ← Back to Home
          </Link>
          <span className="font-sans block text-xs font-bold uppercase tracking-wide text-[var(--color-red)] mb-3">
            {article.category}
          </span>
          <h1 className="font-headline text-[28px] sm:text-[38px] font-bold uppercase leading-[1.05] tracking-[-0.005em] mb-4">
            {article.headline}
          </h1>
          <div className="font-sans flex flex-wrap gap-4 py-3.5 border-y border-[var(--color-hairline)] mb-7 text-[13px] text-[var(--color-gray)]">
            <span>
              By <b className="text-[var(--color-text)]">{article.author}</b>
            </span>
            <span>{article.date}</span>
            <span>{article.readTime}</span>
          </div>
          {article.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImageUrl}
              alt={article.headline}
              className="w-full aspect-video object-cover border border-[var(--color-hairline)] mb-7"
            />
          ) : (
            <div className="w-full aspect-video bg-[#E5E4E0] border border-[var(--color-hairline)] mb-7" />
          )}
          <div
            className="prose prose-neutral max-w-none text-[17px] sm:text-[19px] leading-[1.75]
              prose-headings:font-headline prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-[-0.005em]
              prose-h2:text-[24px] prose-h2:mt-10 prose-h3:text-[21px] prose-h3:mt-8
              prose-p:mb-5 prose-a:text-[var(--color-red)] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[var(--color-text)] prose-blockquote:border-l-[var(--color-red)]
              prose-blockquote:font-headline prose-blockquote:text-[22px] prose-blockquote:not-italic
              prose-img:border prose-img:border-[var(--color-hairline)]"
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />
        </article>
        <div className="mt-10 lg:mt-0">
          <Sidebar articles={allArticles} excludeSlug={article.slug} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
