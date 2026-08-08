// Split out from lib/banners.ts deliberately: this file has zero
// server-only imports (no Prisma), so admin client components can import
// BANNER_PLACEMENT_LABELS as a real value without accidentally bundling
// the Prisma client (and its DATABASE_URL access) into browser JS. A
// value import of anything from lib/banners.ts itself would pull that
// whole module — including its `import { prisma } from "./prisma"` — into
// the client bundle, where DATABASE_URL isn't set and prisma.ts throws at
// module-evaluation time.
export type BannerPlacement = "HOMEPAGE" | "ARTICLE" | "CATEGORY";

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  HOMEPAGE: "Homepage (mid-content)",
  ARTICLE: "Article pages (mid-article)",
  CATEGORY: "Category pages (near top)",
};
