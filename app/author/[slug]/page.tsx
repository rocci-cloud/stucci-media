import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import CategoryLead from "../../components/CategoryLead";
import ArticleGrid from "../../components/ArticleGrid";
import Sidebar from "../../components/Sidebar";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import { getArticlesByAuthorSlug, getPublishedArticles } from "../../lib/articles";
import { getAuthorBySlug, getBylinesWithCounts } from "../../lib/authors";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

// www, not the apex domain — see the PRODUCTION_URL comment in
// app/lib/auth.ts.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

// A byline with no saved profile still gets a page — the name comes off the
// articles themselves. Only the bio, photo and links need a profile row.
async function load(slug: string) {
  const [articles, profile] = await Promise.all([
    getArticlesByAuthorSlug(slug),
    getAuthorBySlug(slug),
  ]);
  if (articles.length === 0 && !profile) return null;
  const name = profile?.name ?? articles[0]?.author ?? "";
  return { articles, profile, name };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return {};

  const description =
    data.profile?.bio?.slice(0, 160) ??
    `Stories, investigations and analysis by ${data.name} for Stucci Media.`;

  return {
    title: data.name,
    description,
    alternates: { canonical: `/author/${slug}` },
    openGraph: {
      title: `${data.name} | Stucci Media`,
      description,
      type: "profile",
      images: [data.profile?.avatarUrl || "/og-default.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.name} | Stucci Media`,
      description,
      images: [data.profile?.avatarUrl || "/og-default.png"],
    },
  };
}

export async function generateStaticParams() {
  const bylines = await getBylinesWithCounts();
  return bylines.map((b) => ({ slug: b.slug }));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  const { articles, profile, name } = data;
  const allArticles = await getPublishedArticles();
  const leadArticles = articles.slice(0, 4);
  const remainingArticles = articles.slice(4);

  const links = [
    profile?.websiteUrl && { label: "Website", href: profile.websiteUrl },
    profile?.twitterUrl && { label: "X", href: profile.twitterUrl },
    profile?.facebookUrl && { label: "Facebook", href: profile.facebookUrl },
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: `${siteUrl}/author/${slug}`,
    ...(profile?.title ? { jobTitle: profile.title } : {}),
    ...(profile?.bio ? { description: profile.bio } : {}),
    ...(profile?.avatarUrl ? { image: profile.avatarUrl } : {}),
    ...(links.length > 0 ? { sameAs: links.map((l) => l.href) } : {}),
    worksFor: { "@type": "Organization", name: "Stucci Media", url: siteUrl },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        <div className="border-b-4 border-[var(--color-navy)] bg-[var(--color-bg-off)]">
          <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-6 sm:pt-10 sm:pb-7">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-[9px] w-[9px] rounded-full bg-[var(--color-red)] shrink-0" />
              <span className="font-headline uppercase font-bold text-[13px] sm:text-[14px] tracking-[0.06em] text-[var(--color-gray)]">
                Author
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              {profile?.avatarUrl ? (
                <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
                  <Image
                    src={profile.avatarUrl}
                    alt={name}
                    fill
                    sizes="84px"
                    className="img-cinematic object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-full bg-[var(--color-red)] font-sans text-[26px] font-bold text-white">
                  {initials(name)}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                  <h1 className="font-headline text-[36px] sm:text-[50px] font-bold uppercase leading-[0.96] tracking-[-0.02em]">
                    {name}
                  </h1>
                  <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.04em] text-[var(--color-gray-light)] mb-1.5">
                    {articles.length} {articles.length === 1 ? "Story" : "Stories"}
                  </span>
                </div>

                {profile?.title && (
                  <p className="font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-[var(--color-red-ink)] mt-1.5">
                    {profile.title}
                  </p>
                )}

                <p className="font-sans text-[var(--color-gray)] text-[15px] sm:text-[16px] leading-[1.55] mt-2.5 max-w-[70ch]">
                  {profile?.bio ?? `Reporting for Stucci Media.`}
                </p>

                {links.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {links.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-[var(--color-red-ink)] hover:underline"
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="mx-auto max-w-[1280px] px-5 py-16 text-center font-sans text-[var(--color-gray)]">
            No published stories from {name} yet.
          </div>
        ) : (
          <>
            <div className="mx-auto max-w-[1280px] px-5 pt-8 sm:pt-10">
              <CategoryLead articles={leadArticles} />
            </div>
            <Reveal>
              <div className="mx-auto max-w-[1280px] px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
                <ArticleGrid articles={remainingArticles} />
                <div className="mt-8 lg:mt-0">
                  <Sidebar articles={allArticles} />
                </div>
              </div>
            </Reveal>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
