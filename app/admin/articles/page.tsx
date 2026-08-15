import { getAllArticlesAdmin } from "../../lib/articles";
import { getCategories } from "../../lib/categories";
import { requireStaffSession } from "../../lib/require-admin";
import { canManageAllContent } from "../../lib/permissions";
import ArticlesClient from "./ArticlesClient";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const session = await requireStaffSession();
  // An AUTHOR only ever sees their own work. Scoped in the query rather
  // than filtered in the client, so the rest of the newsroom's drafts are
  // never sent to their browser in the first place.
  const scopeToSelf = !canManageAllContent(session?.user.role);

  const [articles, categories] = await Promise.all([
    getAllArticlesAdmin(scopeToSelf && session ? { authorId: session.user.id } : {}),
    getCategories(),
  ]);

  return <ArticlesClient initialArticles={articles} categories={categories} />;
}
