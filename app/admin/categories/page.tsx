import { getCategoriesWithCounts } from "../../lib/categories";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return <CategoriesClient initialCategories={categories} />;
}
