import { notFound } from "next/navigation";
import Link from "next/link";
import BreakingBar from "../../../components/BreakingBar";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import Badge from "../../../components/ui/Badge";
import { getArticleByIdAdmin } from "../../../lib/articles";
import { requireAdminSession } from "../../../lib/require-admin";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

// Admin-only, unpublished-safe preview — renders a draft/scheduled article
// with the real public hero + prose treatment (same classes as
// articles/[slug]/page.tsx) but outside the /admin route group, so it
// shows the actual site chrome (BreakingBar/SiteHeader/SiteFooter)
// instead of the dashboard shell. Likes/comments/related-articles are
// deliberately omitted — they depend on a real published article and
// aren't meaningful for something nobody but the admin can see yet.
export default async function ArticlePreviewPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAdminSession();
  if (!session) notFound();

  const article = await getArticleByIdAdmin(Number(id));
  if (!article) notFound();

  return (
    <>
      <div className="bg-[var(--color-navy)] text-white text-center py-2 font-sans text-[12.5px] font-bold uppercase tracking-[0.04em]">
        Draft preview — not visible to the public
        {article.status === "published" && article.isScheduled && " · scheduled, not live yet"}
        {" · "}
        <Link href={`/admin/articles/${article.id}/edit`} className="underline hover:no-underline">
          Back to editor
        </Link>
      </div>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        <section className="relative border-b-4 border-[var(--color-navy)]">
          <div className="relative w-full h-[52svh] min-h-[380px] max-h-[520px] sm:h-[56vh] sm:max-h-[560px] overflow-hidden">
            {article.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.coverImageUrl}
                alt={article.headline}
                className="img-cinematic absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="img-placeholder absolute inset-0" />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.22)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/5" />

            <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-8 sm:pb-9">
              <div className="mx-auto max-w-[820px]">
                <Badge variant="red" className="mb-3">
                  {article.category}
                </Badge>
                <h1 className="font-headline text-white text-[30px] sm:text-[42px] lg:text-[48px] font-bold uppercase leading-[0.98] tracking-[-0.015em] mb-3">
                  {article.headline}
                </h1>
                {article.dek && (
                  <p className="text-white/85 text-[14.5px] sm:text-[17px] leading-[1.5] max-w-[64ch] mb-4">
                    {article.dek}
                  </p>
                )}
                <div className="flex items-center gap-2.5 font-sans text-[12px] sm:text-[13px] tracking-[0.01em] text-white/90">
                  <span className="font-bold text-white">{article.author}</span>
                  <span className="opacity-50">·</span>
                  <span className="uppercase tracking-[0.04em]">{article.date}</span>
                  <span className="opacity-50">·</span>
                  <span className="uppercase tracking-[0.04em]">{article.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[720px] px-5 pt-8 sm:pt-10 pb-18">
          <article>
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
            {article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-sans text-[12px] font-bold text-[var(--color-gray)] bg-[var(--color-bg-off)] rounded-full px-3 py-1"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
