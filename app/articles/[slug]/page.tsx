import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isBot } from "../../lib/analytics-classify";
import type { Metadata } from "next";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Sidebar from "../../components/Sidebar";
import RelatedArticles from "../../components/RelatedArticles";
import Reveal from "../../components/Reveal";
import Badge from "../../components/ui/Badge";
import BannerSlot from "../../components/BannerSlot";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";
import ListenButton from "./ListenButton";
import CommentSection from "./CommentSection";
import LiveBlogTimeline from "./LiveBlogTimeline";
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
        {/* --- Cinematic article hero: same visual language as the
            homepage's FeaturedSection (vignette + scrim, badge/h1/dek/
            byline stack), sized down since this is one story, not the
            site's lead. Renders even without a cover image (falls back
            to img-placeholder) so headline/meta always have a hero to
            sit on, never a layout that shifts based on whether a photo
            exists. --- */}
        <section className="relative border-b-4 border-[var(--color-navy)]">
          <Link
            href="/"
            className="absolute left-4 top-4 sm:left-6 sm:top-6 z-10 min-h-11 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-4 font-sans text-[12.5px] font-bold text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-[0.97]"
          >
            ← Back to Home
          </Link>

          <div className="relative w-full h-[52svh] min-h-[380px] max-h-[520px] sm:h-[56vh] sm:max-h-[560px] overflow-hidden">
            {article.coverImageUrl ? (
              <Image
                src={article.coverImageUrl}
                alt={article.headline}
                fill
                priority
                sizes="100vw"
                className="img-cinematic object-cover"
              />
            ) : (
              <div className="img-placeholder absolute inset-0" />
            )}

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.22)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/5" />

            <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-8 sm:pb-9">
              <div className="mx-auto max-w-[820px] [animation:heroTextReveal_0.9s_cubic-bezier(0.16,1,0.3,1)_0.15s_both]">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="red">{article.category}</Badge>
                  {article.isExclusive && <Badge variant="onDark">Exclusive</Badge>}
                  {article.isLiveBlog && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-red)] px-2.5 py-1 font-sans text-[10.5px] font-bold uppercase tracking-[0.05em] text-white">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                      </span>
                      Live
                    </span>
                  )}
                </div>
                <h1 className="font-headline text-white text-[30px] sm:text-[42px] lg:text-[48px] font-bold uppercase leading-[0.98] tracking-[-0.015em] mb-3">
                  {article.headline}
                </h1>
                {article.dek && (
                  <p className="text-white/85 text-[14.5px] sm:text-[17px] leading-[1.5] max-w-[64ch] mb-4 line-clamp-2">
                    {article.dek}
                  </p>
                )}
                <div className="flex items-center gap-2.5 font-sans text-[12px] sm:text-[13px] tracking-[0.01em] text-white/90">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-red)] text-[11px] font-bold text-white">
                    {getInitials(article.author)}
                  </span>
                  <Link
                    href={`/author/${slugify(article.author)}`}
                    className="inline-flex min-h-11 items-center font-bold text-white hover:underline"
                  >
                    {article.author}
                  </Link>
                  <span className="opacity-50">·</span>
                  <span className="uppercase tracking-[0.04em]">{article.date}</span>
                  <span className="opacity-50">·</span>
                  <span className="uppercase tracking-[0.04em]">{article.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1280px] px-5 pt-8 sm:pt-10 pb-18 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
          <article className="max-w-[720px]">
            <div className="mb-6">
              <ListenButton text={plainText} />
            </div>

            {article.bulletPoints.length > 0 && (
              <div className="mb-7 rounded-card border-l-4 border-[var(--color-red)] bg-[var(--color-bg-off)] px-5 py-4">
                <span className="mb-2 block font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-red)]">
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
                    className="mt-3 inline-flex min-h-11 items-center font-sans text-[12.5px] font-bold text-[var(--color-red)] hover:underline"
                  >
                    See how {article.comparisonSourceLabel || "mainstream coverage"} framed it →
                  </a>
                )}
              </div>
            )}

            {article.isLiveBlog && <LiveBlogTimeline entries={liveBlogEntries} />}

            <div
              className="prose prose-neutral max-w-none text-[17px] sm:text-[19px] leading-[1.75]
                prose-headings:font-headline prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-[-0.01em] prose-headings:leading-[1.1]
                prose-h2:text-[25px] prose-h2:mt-10 prose-h3:text-[21px] prose-h3:mt-8
                prose-p:mb-5 prose-a:text-[var(--color-red)] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-[var(--color-text)] prose-blockquote:border-l-[var(--color-red)]
                prose-blockquote:font-headline prose-blockquote:text-[22px] prose-blockquote:leading-[1.3] prose-blockquote:not-italic
                prose-img:rounded-control prose-img:border prose-img:border-[var(--color-hairline)]
                prose-a:transition-colors"
              dangerouslySetInnerHTML={{ __html: articleBodyFirstHalf }}
            />

            {articleBodySecondHalf && (
              <>
                <BannerSlot placement="ARTICLE" className="my-6" />
                <div
                  className="prose prose-neutral max-w-none text-[17px] sm:text-[19px] leading-[1.75]
                    prose-headings:font-headline prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-[-0.01em] prose-headings:leading-[1.1]
                    prose-h2:text-[25px] prose-h2:mt-10 prose-h3:text-[21px] prose-h3:mt-8
                    prose-p:mb-5 prose-a:text-[var(--color-red)] prose-a:no-underline hover:prose-a:underline
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

            <Reveal>
              <RelatedArticles articles={relatedArticles} />
            </Reveal>

            {settings.featureComments && (
              <Reveal>
                <CommentSection
                  articleId={article.id}
                  initialComments={comments}
                  currentUser={currentUser}
                  signInRedirect={pagePath}
                />
              </Reveal>
            )}
          </article>
          <div className="mt-10 lg:mt-0">
            <Sidebar articles={allArticles} excludeSlug={article.slug} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
