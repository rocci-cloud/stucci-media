import { notFound, redirect } from "next/navigation";
import ArticleEditor from "../../ArticleEditor";
import { updateArticleAction, deleteArticleAction } from "../../actions";
import { getArticleByIdAdmin } from "../../../../lib/articles";
import { getCategories } from "../../../../lib/categories";
import { getLiveBlogEntries } from "../../../../lib/live-blog";
import { getRevisions } from "../../../../lib/revisions";
import { requireStaffSession } from "../../../../lib/require-admin";
import { canEditArticle, canPublish } from "../../../../lib/permissions";
import { Button } from "../../../components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const [article, categories, session] = await Promise.all([
    getArticleByIdAdmin(Number(id)),
    getCategories(),
    requireStaffSession(),
  ]);
  if (!article) notFound();
  if (!session) redirect(`/login?from=/admin/articles/${id}/edit`);

  // An author opening someone else's article gets bounced rather than
  // shown a form whose every save would be rejected server-side.
  if (!canEditArticle(session.user.role, session.user.id, article.authorId)) {
    redirect("/admin/articles");
  }

  const [liveBlogEntries, revisions] = await Promise.all([
    getLiveBlogEntries(article.id),
    getRevisions(article.id),
  ]);

  const boundUpdate = updateArticleAction.bind(null, article.id);
  const boundDelete = deleteArticleAction.bind(null, article.id);
  // www, not the apex domain — see the PRODUCTION_URL comment in
  // app/lib/auth.ts.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

  return (
    <div className="max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--admin-fg)]">Edit article</h2>
        <form action={boundDelete}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg)]"
          >
            <Trash2 className="h-4 w-4" />
            Move to trash
          </Button>
        </form>
      </div>
      <ArticleEditor
        article={article}
        categories={categories}
        action={boundUpdate}
        siteUrl={siteUrl}
        liveBlogEntries={liveBlogEntries}
        revisions={revisions}
        canPublish={canPublish(session.user.role)}
      />
    </div>
  );
}
