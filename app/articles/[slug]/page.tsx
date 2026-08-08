import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Sidebar from "../../components/Sidebar";
import RelatedArticles from "../../components/RelatedArticles";
import Badge from "../../components/ui/Badge";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import { getArticleBySlug, getPublishedArticles, getRelatedArticles } from "../../lib/articles";
import { getLikeCount, hasUserLiked } from "../../lib/likes";
import { getApprovedCommentsForArticle } from "../../lib/comments";
import { auth } from "../../lib/auth";

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
  const [article, allArticles, session] = await Promise.all([
    getArticleBySlug(slug),
    getPublishedArticles(),
    auth.api.getSession({ headers: await headers() }),
  ]);
  if (!article) notFound();

  const [likeCount, liked, comments, relatedArticles] = await Promise.all([
    getLikeCount(article.id),
    session ? hasUserLiked(article.id, session.user.id) : Promise.resolve(false),
    getApprovedCommentsForArticle(article.id),
    getRelatedArticles(article, 6),
  ]);

  const currentUser = session
    ? { id: session.user.id, name: session.user.name, image: session.user.image ?? null }
    : null;
  const pagePath = `/articles/${article.slug}`;

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-5 pt-8 pb-18 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
        <article className="max-w-[720px]">
          <Link
            href="/"
            className="min-h-11 flex w-fit items-center font-sans text-[13px] text-[var(--color-gray)] hover:text-[var(--color-text)] hover:underline mb-2"
          >
            ← Back to Home
          </Link>
          <Badge variant="text" className="mb-3">
            {article.category}
          </Badge>
          <h1 className="font-headline text-[31px] sm:text-[42px] font-bold uppercase leading-[0.98] tracking-[-0.015em] mb-4">
            {article.headline}
          </h1>
          <div className="font-sans flex flex-wrap items-center gap-x-3 gap-y-1 py-3.5 border-y border-[var(--color-hairline)] mb-7 text-[13px] text-[var(--color-gray)]">
            <span>
              By <b className="text-[var(--color-text)]">{article.author}</b>
            </span>
            <span className="text-[var(--color-hairline-strong)]/30">·</span>
            <span className="text-[12px] uppercase tracking-[0.04em]">{article.date}</span>
            <span className="text-[var(--color-hairline-strong)]/30">·</span>
            <span className="text-[12px] uppercase tracking-[0.04em]">{article.readTime}</span>
          </div>
          <div className="relative mb-7">
            {article.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.coverImageUrl}
                alt={article.headline}
                className="img-cinematic w-full aspect-video object-cover rounded-card shadow-card"
              />
            ) : (
              <div className="img-placeholder w-full aspect-video rounded-card" />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-card bg-gradient-to-t from-black/12 to-transparent" />
          </div>
          <div
            className="prose prose-neutral max-w-none text-[17px] sm:text-[19px] leading-[1.75]
              prose-headings:font-headline prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-[-0.01em] prose-headings:leading-[1.1]
              prose-h2:text-[25px] prose-h2:mt-10 prose-h3:text-[21px] prose-h3:mt-8
              prose-p:mb-5 prose-a:text-[var(--color-red)] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[var(--color-text)] prose-blockquote:border-l-[var(--color-red)]
              prose-blockquote:font-headline prose-blockquote:text-[22px] prose-blockquote:leading-[1.3] prose-blockquote:not-italic
              prose-img:rounded-control prose-img:border prose-img:border-[var(--color-hairline)]
              prose-a:transition-colors"
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />

          <div className="mt-8 pt-6 border-t border-[var(--color-hairline)]">
            <LikeButton
              articleId={article.id}
              initialCount={likeCount}
              initialLiked={liked}
              isSignedIn={Boolean(currentUser)}
              signInRedirect={pagePath}
            />
          </div>

          <RelatedArticles articles={relatedArticles} />

          <CommentSection
            articleId={article.id}
            initialComments={comments}
            currentUser={currentUser}
            signInRedirect={pagePath}
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
