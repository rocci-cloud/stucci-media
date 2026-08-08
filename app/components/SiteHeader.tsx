import { getNavCategories } from "../lib/categories";
import SiteHeaderClient from "./SiteHeaderClient";

// Server wrapper so every existing `<SiteHeader />` call site (home,
// category, article, about, contact, search, login, register, subscribe,
// privacy) picks up the admin's nav visibility/order automatically —
// nothing else had to change at any of those call sites. The interactive
// bits (scroll shadow, mobile menu, search overlay) still live in the
// client component this renders.
export default async function SiteHeader() {
  const categories = await getNavCategories();
  return <SiteHeaderClient navCategories={categories.map((c) => ({ slug: c.slug, label: c.label }))} />;
}
