import { redirect } from "next/navigation";
import { requireAdminSession } from "../../lib/require-admin";
import { getCategoriesWithCounts } from "../../lib/categories";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // Admin-only. The /admin layout now admits editors and authors
  // too, so this section re-checks rather than relying on it.
  if (!(await requireAdminSession())) redirect("/admin");

  const categories = await getCategoriesWithCounts();

  return <CategoriesClient initialCategories={categories} />;
}
