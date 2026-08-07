import { notFound } from "next/navigation";
import ArticleForm from "../../../ArticleForm";
import { updateArticleAction, deleteArticleAction } from "../../actions";
import { getArticleByIdAdmin } from "../../../../lib/articles";
import { getCategories } from "../../../../lib/categories";
import { Button } from "../../../components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const [article, categories] = await Promise.all([
    getArticleByIdAdmin(Number(id)),
    getCategories(),
  ]);
  if (!article) notFound();

  const boundUpdate = updateArticleAction.bind(null, article.id);
  const boundDelete = deleteArticleAction.bind(null, article.id);

  return (
    <div className="max-w-[720px]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--admin-fg)]">Edit article</h2>
        <form action={boundDelete}>
          <Button type="submit" variant="outline" size="sm" className="text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg)]">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </form>
      </div>
      <ArticleForm article={article} categories={categories} action={boundUpdate} />
    </div>
  );
}
