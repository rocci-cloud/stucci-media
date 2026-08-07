import { notFound } from "next/navigation";
import ArticleForm from "../../../ArticleForm";
import { updateArticleAction, deleteArticleAction } from "../../actions";
import { getArticleByIdAdmin } from "../../../../lib/articles";
import { getCategories } from "../../../../lib/categories";

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
    <main className="max-w-[720px] mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-[28px] font-black">Edit Article</h1>
        <form action={boundDelete}>
          <button
            type="submit"
            className="font-sans text-sm font-bold uppercase text-[var(--color-red)] hover:underline"
          >
            Delete
          </button>
        </form>
      </div>
      <ArticleForm article={article} categories={categories} action={boundUpdate} />
    </main>
  );
}
