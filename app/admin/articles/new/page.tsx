import ArticleEditor from "../ArticleEditor";
import { createArticleAction } from "../actions";
import { getCategories } from "../../../lib/categories";
import { requireStaffSession } from "../../../lib/require-admin";
import { canPublish } from "../../../lib/permissions";

export default async function NewArticlePage() {
  const [categories, session] = await Promise.all([getCategories(), requireStaffSession()]);
  // www, not the apex domain — see the PRODUCTION_URL comment in
  // app/lib/auth.ts.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

  return (
    <div className="max-w-[1100px]">
      <h2 className="mb-6 text-lg font-semibold text-[var(--admin-fg)]">New article</h2>
      <ArticleEditor
        categories={categories}
        action={createArticleAction}
        siteUrl={siteUrl}
        canPublish={canPublish(session?.user.role)}
      />
    </div>
  );
}
