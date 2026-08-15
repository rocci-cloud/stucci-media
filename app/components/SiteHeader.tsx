import { getMainNavCategories, getMoreNavCategories } from "../lib/categories";
import { getSiteSettings } from "../lib/settings";
import SiteHeaderClient from "./SiteHeaderClient";

// Server wrapper so every existing `<SiteHeader />` call site (home,
// category, article, about, contact, search, login, register, subscribe,
// privacy) picks up the admin's nav placement/order automatically —
// nothing else had to change at any of those call sites. The interactive
// bits (scroll shadow, mobile menu, search overlay, "More" dropdown)
// still live in the client component this renders.
export default async function SiteHeader() {
  const [mainCategories, moreCategories, settings] = await Promise.all([
    getMainNavCategories(),
    getMoreNavCategories(),
    getSiteSettings(),
  ]);
  const toNavItem = (c: { slug: string; label: string }) => ({ slug: c.slug, label: c.label });
  return (
    <SiteHeaderClient
      mainCategories={mainCategories.map(toNavItem)}
      moreCategories={moreCategories.map(toNavItem)}
      showPushOptIn={settings.featurePushAlerts}
    />
  );
}
