import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isBot } from "../../lib/analytics-classify";
import type { Metadata } from "next";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import ArticleRail from "../../components/ArticleRail";
import PrevNextCards from "../../components/PrevNextCards";
import RelatedArticles from "../../components/RelatedArticles";
import Reveal from "../../components/Reveal";
import Badge from "../../components/ui/Badge";
import BannerSlot from "../../components/BannerSlot";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";
import ListenButton from "./ListenButton";
import CommentSection from "./CommentSection";
import { createCommentAction } from "./actions";
import ArticleSubscribeCta from "../../components/ArticleSubscribeCta";
import ServicePromo from "../../components/ServicePromo";
import LiveBlogTimeline from "./LiveBlogTimeline";
import ShareRow from "./ShareRow";
import {
  getArticleBySlug,
  getPublishedArticles,
  getRelatedArticles,
  incrementArticleViewCount,
} from "../../lib/articles";
import { getLikeCount, hasUserLiked } from "../../lib/likes";
import { hasUserSaved } from "../../lib/saved-articles";
import { getApprovedCommentsForArticle } from "../../lib/comments";
import { getLiveBlogEntries } from "../../lib/live-blog";
import { recordVisit } from "../../lib/streaks";
import { recordCategoryInterest } from "../../lib/interests";
import { auth } from "../../lib/auth";
import { getSiteSettings } from "../../lib/settings";
import { slugify } from "../../lib/slugify";
import { splitHtmlAtMidpoint } from "../../lib/split-html-midpoint";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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

  // Prefer the dedicated SEO fields (set/backfilled via the admin SEO
  // panel — see CLAUDE.md Phase 9/13) over the raw editorial headline/
  // dek, since those are hand-tuned for length and focus-keyword
  // placement; fall back to headline/dek for the (now rare) article
  // that doesn't have them set.
  const metaTitle = article.seoTitle || article.headline;
  const metaDescription = article.seoDescription || article.dek;
  const image = article.ogImage || article.coverImageUrl || "/og-default.png";
  const canonicalPath = article.canonicalUrl || `/articles/${article.slug}`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: article.seoKeywords || undefined,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "article",
      // article.date is the human-formatted display string ("July 10,
      // 2026") — OpenGraph's published_time needs real ISO 8601, which
      // is what publishedAt (the raw DB timestamp) actually is.
      publishedTime: article.publishedAt ?? undefined,
      authors: [article.author],
      section: article.category,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
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
  const [article, allArticles, session, settings] = await Promise.all([
    getArticleBySlug(slug),
    getPublishedArticles(),
    auth.api.getSession({ headers: await headers() }),
    getSiteSettings(),
  ]);
  if (!article) notFound();

  // Fire-and-forget — never block rendering on a write.
  //
  // Skipped for crawlers and link-preview scrapers. This counter used to
  // increment on every render, which is why the lifetime totals it has
  // accumulated so far read high; they are left as they are rather than
  // rewritten, but from here on it counts people. The richer per-visit
  // series lives in page_views (see lib/analytics.ts) and applies the same
  // filter at its own collector.
  if (!isBot((await headers()).get("user-agent"))) {
    incrementArticleViewCount(article.id).catch(() => {});
  }
  if (session) {
    recordVisit(session.user.id).catch(() => {});
    recordCategoryInterest(session.user.id, article.categorySlug).catch(() => {});
  }

  const [likeCount, liked, saved, comments, relatedArticles, liveBlogEntries] = await Promise.all([
    getLikeCount(article.id),
    session ? hasUserLiked(article.id, session.user.id) : Promise.resolve(false),
    session ? hasUserSaved(article.id, session.user.id) : Promise.resolve(false),
    settings.featureComments ? getApprovedCommentsForArticle(article.id) : Promise.resolve([]),
    getRelatedArticles(article, 6),
    article.isLiveBlog ? getLiveBlogEntries(article.id) : Promise.resolve([]),
  ]);

  const currentUser = session
    ? { id: session.user.id, name: session.user.name, image: session.user.image ?? null }
    : null;
  const pagePath = `/articles/${article.slug}`;

  // "Published August 21, 2026 at 4:37 PM EDT" — the newsroom's clock, not
  // the reader's. `article.date` is a pre-formatted display date with no
  // time in it, so this formats the raw ISO timestamp instead.
  const publishedStamp = article.publishedAt
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
        .format(new Date(article.publishedAt))
        .replace(" at ", " at ")
    : article.date;

  // Previous/next by position in the published list the page already
  // fetched for the rail — newest first, so "previous" is the newer story.
  const currentIndex = allArticles.findIndex((a) => a.slug === article.slug);
  const previousArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : undefined;
  const nextArticle =
    currentIndex >= 0 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : undefined;

  // Mid-article banner slot: split the sanitized body at the nearest
  // top-level block boundary to its midpoint (see splitHtmlAtMidpoint) so
  // the banner renders between two real paragraphs/blocks, never inside
  // one. Short articles with fewer than 2 top-level blocks fall back to
  // rendering the whole body with no split — no banner in the body in
  // that case, since there's no real "middle" to put one at.
  const [articleBodyFirstHalf, articleBodySecondHalf] = splitHtmlAtMidpoint(article.bodyHtml);

  // Plain-text version of the article for ListenButton's browser-native
  // text-to-speech — a blunt tag-strip, same technique lib/articles.ts's
  // estimateReadTime already uses, not a real HTML parser.
  const plainText = `${article.headline}. ${article.dek}. ${article.bodyHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()}`;

  // www, not the apex domain — see the PRODUCTION_URL comment in
  // app/lib/auth.ts.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";
  const articleUrl = `${siteUrl}${pagePath}`;
  // Same canonical-override logic as generateMetadata's `alternates.canonical`
  // above — mainEntityOfPage must point at the same URL Google is told is
  // canonical, not always the raw slug path, or the two signals disagree.
  const canonicalUrl = article.canonicalUrl || articleUrl;
  const articleImage = article.ogImage || article.coverImageUrl || `${siteUrl}/og-default.png`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.headline,
    description: article.dek,
    image: [articleImage],
    datePublished: article.publishedAt ?? undefined,
    // publishedAt can be null for the rare article missing a set publish
    // date — dateModified still reflects the real last-edit timestamp,
    // which always exists.
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.author,
      url: `${siteUrl}/author/${slugify(article.author)}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Stucci Media",
      logo: { "@type": "ImageObject", url: `${siteUrl}/og-default.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    articleSection: article.category,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: article.category,
        item: `${siteUrl}/category/${article.categorySlug}`,
      },
      { "@type": "ListItem", position: 3, name: article.headline, item: articleUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        {/* The headline sits on the page, not on the photo. A scrim-and-
            overlay hero looks like a magazine cover and costs a news story
            the two things it actually needs above the fold: a headline at
            full contrast on the page background, and the byline that tells
            a reader who filed it and when. The photo runs under the byline
            instead, at the column width. */}
        <div className="mx-auto max-w-[1200px] px-5 pt-5 sm:pt-7 pb-16 grid grid-cols-1 lg:grid-cols-[minmax(0,720px)_320px] lg:justify-center gap-x-10">
          <article className="max-w-[720px]">
            <Link
              href={`/category/${article.categorySlug}`}
              className="inline-flex min-h-11 items-center font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--color-red-ink)] transition-colors hover:text-[var(--color-red-dark)]"
            >
              {article.category}
            </Link>

            <h1 className="mt-1 font-headline font-bold uppercase text-[var(--color-text)] text-[length:clamp(2.25rem,4vw,3.25rem)] leading-[0.98] tracking-[-0.02em]">
              {article.headline}
            </h1>

            {article.dek && (
              <p className="mt-3 font-sans text-[1.125rem] sm:text-[1.25rem] font-normal leading-[1.5] text-[var(--color-gray)] max-w-[62ch]">
                {article.dek}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[13px] text-[var(--color-gray)]">
              <span>
                By{" "}
                <Link
                  href={`/author/${slugify(article.author)}`}
                  className="font-bold text-[var(--color-text)] hover:text-[var(--color-red-ink)] transition-colors"
                >
                  {article.author}
                </Link>
              </span>
              <span className="text-[var(--color-gray-light)]">Stucci Media</span>
              <span aria-hidden className="text-[var(--color-gray-light)]">•</span>
              <span className="text-[var(--color-gray-light)]">Published {publishedStamp}</span>
              {(article.isExclusive || article.isLiveBlog) && (
                <span className="flex items-center gap-1.5">
                  {article.isExclusive && <Badge variant="navy">Exclusive</Badge>}
                  {article.isLiveBlog && (
                    <span className="inline-flex items-center gap-1.5 bg-[var(--color-red)] px-2 py-[3px] font-sans text-[10.5px] font-bold uppercase tracking-[0.05em] text-white">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                      </span>
                      Live
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="mt-3">
              <ShareRow title={article.headline} />
            </div>

            <figure className="mt-5">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-bg-off)]">
                {article.coverImageUrl ? (
                  <Image
                    src={article.coverImageUrl}
                    alt={article.headline}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 720px"
                    className="img-cinematic object-cover"
                  />
                ) : (
                  <div className="img-placeholder absolute inset-0" />
                )}
              </div>
              {(article.imageCaption || article.imageCredit) && (
                <figcaption className="mt-2 font-sans text-[13px] leading-[1.45] text-[var(--color-gray-light)]">
                  {article.imageCaption}
                  {article.imageCaption && article.imageCredit ? " " : ""}
                  {article.imageCredit && (
                    <span className="uppercase tracking-[0.04em]">({article.imageCredit})</span>
                  )}
                </figcaption>
              )}
            </figure>

            <div className="mt-6">
              <ListenButton text={plainText} />
            </div>

            {article.bulletPoints.length > 0 && (
              <div className="mb-7 rounded-card border-l-4 border-[var(--color-red)] bg-[var(--color-bg-off)] px-5 py-4">
                <span className="mb-2 block font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-red-ink)]">
                  Bottom Line
                </span>
                <ul className="flex flex-col gap-2">
                  {article.bulletPoints.map((point, i) => (
                    <li key={i} className="flex gap-2.5 font-sans text-[14.5px] leading-[1.5] text-[var(--color-text)]">
                      <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--color-red)]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {article.comparisonTitle && article.comparisonBody && (
              <div className="mb-7 rounded-card border border-[var(--color-navy)]/15 bg-[var(--color-navy)] px-5 py-5">
                <span className="mb-2 block font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-white/60">
                  What They&rsquo;re Not Telling You
                </span>
                <h2 className="mb-2 font-headline text-[18px] font-bold uppercase leading-[1.15] tracking-[-0.005em] text-white">
                  {article.comparisonTitle}
                </h2>
                <p className="font-sans text-[14.5px] leading-[1.55] text-white/85">{article.comparisonBody}</p>
                {article.comparisonSourceUrl && (
                  <a
                    href={article.comparisonSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-11 items-center font-sans text-[12.5px] font-bold text-[var(--color-red-ink)] hover:underline"
                  >
                    See how {article.comparisonSourceLabel || "mainstream coverage"} framed it →
                  </a>
                )}
              </div>
            )}

            {article.isLiveBlog && <LiveBlogTimeline entries={liveBlogEntries} />}

            <div
              className="article-dropcap prose prose-neutral max-w-none text-[18px] sm:text-[20px] leading-[1.7]
                prose-headings:font-headline prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-[-0.01em] prose-headings:leading-[1.1]
                prose-h2:text-[25px] prose-h2:mt-10 prose-h3:text-[21px] prose-h3:mt-8
                prose-p:mb-5 prose-a:text-[var(--color-red-ink)] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-[var(--color-text)] prose-blockquote:border-l-[var(--color-red)]
                prose-blockquote:font-headline prose-blockquote:text-[22px] prose-blockquote:leading-[1.3] prose-blockquote:not-italic
                prose-img:rounded-control prose-img:border prose-img:border-[var(--color-hairline)]
                prose-a:transition-colors"
              dangerouslySetInnerHTML={{ __html: articleBodyFirstHalf }}
            />

            {articleBodySecondHalf && (
              <>
                {/* Mid-article: the reader is engaged and has not yet
                    decided what to do next, which is the strongest slot on
                    the site for a house ad. */}
                <ServicePromo className="my-8" />
                <BannerSlot placement="ARTICLE" className="my-6" />
                <div
                  className="prose prose-neutral max-w-none text-[18px] sm:text-[20px] leading-[1.7]
                    prose-headings:font-headline prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-[-0.01em] prose-headings:leading-[1.1]
                    prose-h2:text-[25px] prose-h2:mt-10 prose-h3:text-[21px] prose-h3:mt-8
                    prose-p:mb-5 prose-a:text-[var(--color-red-ink)] prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-[var(--color-text)] prose-blockquote:border-l-[var(--color-red)]
                    prose-blockquote:font-headline prose-blockquote:text-[22px] prose-blockquote:leading-[1.3] prose-blockquote:not-italic
                    prose-img:rounded-control prose-img:border prose-img:border-[var(--color-hairline)]
                    prose-a:transition-colors"
                  dangerouslySetInnerHTML={{ __html: articleBodySecondHalf }}
                />
              </>
            )}

            {article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tag/${encodeURIComponent(tag.toLowerCase())}`}
                    className="inline-flex min-h-11 items-center font-sans text-[12px] font-bold text-[var(--color-gray)] bg-[var(--color-bg-off)] hover:bg-[var(--color-hairline)] rounded-full px-3.5 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between rounded-card border border-[var(--color-hairline)] bg-[var(--color-bg-off)] px-5 py-4">
              <span className="font-sans text-[13px] font-bold text-[var(--color-text)]">
                Enjoyed this story?
              </span>
              <div className="flex items-center gap-2">
                {settings.featureLikes && (
                  <LikeButton
                    articleId={article.id}
                    initialCount={likeCount}
                    initialLiked={liked}
                    isSignedIn={Boolean(currentUser)}
                    signInRedirect={pagePath}
                  />
                )}
                <SaveButton
                  articleId={article.id}
                  initialSaved={saved}
                  isSignedIn={Boolean(currentUser)}
                  signInRedirect={pagePath}
                />
              </div>
            </div>

            {/* Placed after the like/save bar and before "Keep Reading":
                the reader has finished the piece and is deciding what to do
                next, which is the moment the ask is worth making. */}
            <Reveal>
              <div className="mt-8">
                <ArticleSubscribeCta />
              </div>
            </Reveal>

            <Reveal>
              <RelatedArticles
                articles={relatedArticles}
                category={article.category}
                categorySlug={article.categorySlug}
              />
            </Reveal>

            <PrevNextCards previous={previousArticle} next={nextArticle} />

            {settings.featureComments && (
              <Reveal>
                <CommentSection
                  postComment={createCommentAction.bind(null, article.id)}
                  initialComments={comments}
                  currentUser={currentUser}
                  signInRedirect={pagePath}
                />
              </Reveal>
            )}
          </article>
          {/* Below lg the rail moves under the article, after the related
              cards — a reader on a phone should reach the end of the story
              before a list of other stories. */}
          <div className="mt-10 lg:mt-0">
            <ArticleRail articles={allArticles} excludeSlug={article.slug} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
