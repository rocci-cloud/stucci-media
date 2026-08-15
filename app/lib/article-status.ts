// Article-status labels + the value type, kept in a Prisma-free module so
// client components (the articles list, the editor, trash, and the
// podcast editor/list, which all reuse this same lowercase status
// vocabulary — see lib/podcast.ts) can import them without dragging
// lib/articles.ts's Prisma import into the browser bundle. Same fix
// Phase 36 applied to lib/banner-placements.ts after the identical bug:
// a client component doing a plain value import of a label constant from
// a module that also imports `prisma` at module scope pulls the whole
// module — Prisma client and all — into client JS, which then throws
// "DATABASE_URL is not set" the moment it evaluates in the browser.

// The editorial pipeline as the admin UI speaks it. Lowercase strings
// rather than the Prisma enum so every component (client ones included)
// can use this type without pulling in @prisma/client. "scheduled" is
// NOT here on purpose — it's derived from published + a future
// publishedAt, not a stored state.
export type ArticleStatusValue = "draft" | "in_review" | "published" | "archived";

export const ARTICLE_STATUS_LABELS: Record<ArticleStatusValue, string> = {
  draft: "Draft",
  in_review: "In Review",
  published: "Published",
  archived: "Archived",
};
