import { prisma } from "./prisma";
import { slugify } from "./slugify";
import { getCategories } from "./categories";
import type { Article as PrismaArticle, ArticleStatus, Prisma } from "@prisma/client";
// Re-exported below for existing server-side importers — the type and its
// label map live in a Prisma-free module (lib/article-status.ts) so client
// components can import them without dragging this file's `prisma` import
// (and its DATABASE_URL check) into the browser bundle.
import { ARTICLE_STATUS_LABELS, type ArticleStatusValue } from "./article-status";

export { ARTICLE_STATUS_LABELS };
export type { ArticleStatusValue };

export type Article = {
  id: number;
  slug: string;
  categorySlug: string; // legacy primary category — first of categorySlugs, kept in sync
  category: string; // primary category label
  categorySlugs: string[]; // full multi-select set
  categories: string[]; // labels, same order as categorySlugs
  headline: string;
  dek: string;
  author: string;
  date: string;
  readTime: string;
  bodyHtml: string;
  coverImageUrl: string | null;
  status: ArticleStatusValue;
  isFeatured: boolean;
  isExclusive: boolean;
  isBreaking: boolean;
  isLiveBlog: boolean;
  viewCount: number;
  socialNotes: string | null;
  authorId: string | null;
  deletedAt: string | null;
  tags: string[];
  bulletPoints: string[];
  // A short editorial punch phrase shown above the headline on story cards
  // and, when set, in the lead photo's crimson overlay bar. There is no
  // column behind it yet — cards fall back to the category label — so this
  // is always undefined today. Adding the column plus an editor field is a
  // deliberate follow-up rather than a silent half-feature.
  kicker?: string | null;
  comparisonTitle: string | null;
  comparisonBody: string | null;
  comparisonSourceLabel: string | null;
  comparisonSourceUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  publishedAt: string | null; // raw ISO, for the date picker — `date` above is the formatted display version
  updatedAt: string; // raw ISO — used for NewsArticle dateModified structured data
  // Derived, not stored: status is PUBLISHED but publishedAt is still in
  // the future — the article exists and is "published" in the admin's
  // eyes, but every public read query (see PUBLISHED_WHERE below) filters
  // it out until that moment, so it's not actually live yet.
  isScheduled: boolean;
};

export type ArticleInput = {
  slug: string;
  categorySlugs: string[]; // first entry is the legacy primary category
  headline: string;
  dek: string;
  author: string;
  bodyHtml: string; // sanitized HTML — rendered as-is via dangerouslySetInnerHTML
  coverImageUrl: string | null;
  status: ArticleStatusValue;
  isFeatured: boolean;
  isExclusive: boolean;
  isBreaking: boolean;
  isLiveBlog: boolean;
  socialNotes: string | null;
  // Set on create from the signed-in staff member; omitted on update so
  // editing someone else's article never reassigns its byline owner.
  authorId?: string | null;
  tags: string[];
  bulletPoints: string[];
  comparisonTitle: string | null;
  comparisonBody: string | null;
  comparisonSourceLabel: string | null;
  comparisonSourceUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  publishedAt: string | null; // ISO date string from the date picker, or null to auto-stamp on publish
};

const WORDS_PER_MINUTE = 200;

const ARTICLE_WITH_CATEGORIES = {
  include: { categories: { include: { category: true }, orderBy: { categoryId: "asc" as const } } },
} satisfies Prisma.ArticleDefaultArgs;

type ArticleWithCategories = Prisma.ArticleGetPayload<typeof ARTICLE_WITH_CATEGORIES>;

function formatDate(value: Date | null) {
  if (!value) return "";
  return value.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function estimateReadTime(bodyHtml: string) {
  const text = bodyHtml.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

function toStatus(status: ArticleStatus): ArticleStatusValue {
  switch (status) {
    case "PUBLISHED":
      return "published";
    case "IN_REVIEW":
      return "in_review";
    case "ARCHIVED":
      return "archived";
    default:
      return "draft";
  }
}

function toPrismaStatus(status: ArticleStatusValue): ArticleStatus {
  switch (status) {
    case "published":
      return "PUBLISHED";
    case "in_review":
      return "IN_REVIEW";
    case "archived":
      return "ARCHIVED";
    default:
      return "DRAFT";
  }
}

async function categorySlugToLabel(): Promise<Map<string, string>> {
  const cats = await getCategories();
  return new Map(cats.map((c) => [c.slug, c.label]));
}

function mapRow(row: PrismaArticle | ArticleWithCategories, labelBySlug: Map<string, string>): Article {
  const categorySlugs =
    "categories" in row ? row.categories.map((ac) => ac.category.slug) : [row.categorySlug];
  const categories = categorySlugs.map((slug) => labelBySlug.get(slug) ?? slug);
  const isScheduled = row.status === "PUBLISHED" && row.publishedAt !== null && row.publishedAt > new Date();

  return {
    id: row.id,
    slug: row.slug,
    categorySlug: row.categorySlug,
    category: labelBySlug.get(row.categorySlug) ?? row.categorySlug,
    categorySlugs: categorySlugs.length > 0 ? categorySlugs : [row.categorySlug],
    categories: categories.length > 0 ? categories : [labelBySlug.get(row.categorySlug) ?? row.categorySlug],
    headline: row.headline,
    dek: row.dek,
    author: row.author,
    date: formatDate(row.publishedAt ?? row.createdAt),
    readTime: estimateReadTime(row.body),
    bodyHtml: row.body,
    coverImageUrl: row.coverImageUrl,
    status: toStatus(row.status),
    isFeatured: row.isFeatured,
    isExclusive: row.isExclusive,
    isBreaking: row.isBreaking,
    isLiveBlog: row.isLiveBlog,
    viewCount: row.viewCount,
    socialNotes: row.socialNotes,
    authorId: row.authorId,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    tags: row.tags,
    bulletPoints: row.bulletPoints,
    comparisonTitle: row.comparisonTitle,
    comparisonBody: row.comparisonBody,
    comparisonSourceLabel: row.comparisonSourceLabel,
    comparisonSourceUrl: row.comparisonSourceUrl,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoKeywords: row.seoKeywords,
    ogImage: row.ogImage,
    canonicalUrl: row.canonicalUrl,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
    isScheduled,
  };
}

// Every public-facing read uses this — status PUBLISHED alone isn't
// enough, a future publishedAt means the admin has scheduled it and it
// isn't live yet. A fresh `new Date()` per call, not a module-level
// constant, since these queries run across a long-lived server process.
// A soft-deleted article (deletedAt set) is in the trash and must never
// surface publicly OR in the normal admin lists — only /admin/trash reads
// past this filter.
function publishedWhere() {
  return { status: "PUBLISHED" as const, publishedAt: { lte: new Date() }, deletedAt: null };
}

// --- Public reads (published only) ---

export async function getPublishedArticles(): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({ where: publishedWhere(), orderBy: { publishedAt: "desc" } }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

/**
 * Every tag in use on a published article, with how many articles carry it.
 *
 * Tags are a plain text[] column rather than a join table (they're
 * editorial labels, not taxonomy — categories own that), so this unnests
 * in SQL rather than pulling every article into memory to count.
 */
export async function getAllTagsWithCounts(): Promise<Array<{ tag: string; count: number }>> {
  const rows = await prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
    SELECT lower(tag) AS tag, count(*) AS count
    FROM articles, unnest(tags) AS tag
    WHERE status = 'PUBLISHED' AND published_at <= now() AND deleted_at IS NULL
    GROUP BY lower(tag)
    ORDER BY count(*) DESC, lower(tag) ASC
  `;
  return rows.map((r) => ({ tag: r.tag, count: Number(r.count) }));
}

/**
 * Published articles carrying a tag, matched case-insensitively — an editor
 * typing "Florida" and "florida" on two articles means one tag, not two.
 */
export async function getArticlesByTag(tag: string): Promise<Article[]> {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return [];

  const matches = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM articles
    WHERE status = 'PUBLISHED' AND published_at <= now() AND deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE lower(t) = ${normalized})
    ORDER BY published_at DESC
  `;
  if (matches.length === 0) return [];

  const order = new Map(matches.map((r, i) => [r.id, i]));
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({ where: { id: { in: matches.map((r) => r.id) } } }),
    categorySlugToLabel(),
  ]);
  return rows
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((row) => mapRow(row, labelBySlug));
}

/**
 * Published articles for a byline.
 *
 * The slug is matched by running the site's own slugify() over the distinct
 * author strings, not by reimplementing it in SQL. An earlier version did the
 * latter and the two drifted: JS collapses runs of hyphens and treats tabs as
 * whitespace, the SQL expression did neither, so a byline like "Rocci -
 * Stucci" produced a link to /author/rocci-stucci while the lookup computed
 * "rocci---stucci" and the page 404'd. There are only ever a handful of
 * distinct bylines, so filtering them in JS costs nothing and keeps one
 * implementation of the rule.
 */
export async function getArticlesByAuthorSlug(slug: string): Promise<Article[]> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return [];

  const distinctAuthors = await prisma.article.findMany({
    where: publishedWhere(),
    select: { author: true },
    distinct: ["author"],
  });
  const names = distinctAuthors
    .map((a) => a.author)
    .filter((name) => slugify(name) === normalized);
  if (names.length === 0) return [];

  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: { ...publishedWhere(), author: { in: names } },
      orderBy: { publishedAt: "desc" },
    }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

const SEARCH_LIMIT = 50;

/**
 * Full-text search across headline, excerpt and body.
 *
 * Runs in Postgres rather than in the browser. The search page used to load
 * every published article — bodies included — and filter in memory, which
 * meant the payload grew with the archive (roughly 365KB at 89 articles) and
 * body text was never actually searchable, only headline/excerpt/category.
 *
 * `websearch_to_tsquery` is used rather than `plainto_tsquery` so readers get
 * the search syntax they already expect from Google — quoted phrases, OR, and
 * a leading `-` to exclude. It never throws on malformed input, which
 * `to_tsquery` does. The ILIKE arm alongside it catches partial words and tag
 * matches that stemming alone would miss ("budg" won't stem to "budget").
 */
export async function searchPublishedArticles(query: string): Promise<Article[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const like = `%${trimmed.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;

  const ranked = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM articles
    WHERE status = 'PUBLISHED'
      AND published_at <= now()
      AND deleted_at IS NULL
      AND (
        to_tsvector(
          'english',
          coalesce(headline, '') || ' ' || coalesce(dek, '') || ' ' ||
          regexp_replace(coalesce(body, ''), '<[^>]*>', ' ', 'g')
        ) @@ websearch_to_tsquery('english', ${trimmed})
        OR headline ILIKE ${like}
        OR dek ILIKE ${like}
        OR category_slug ILIKE ${like}
        OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE ${like})
      )
    ORDER BY
      ts_rank(
        to_tsvector(
          'english',
          coalesce(headline, '') || ' ' || coalesce(dek, '') || ' ' ||
          regexp_replace(coalesce(body, ''), '<[^>]*>', ' ', 'g')
        ),
        websearch_to_tsquery('english', ${trimmed})
      ) DESC,
      published_at DESC
    LIMIT ${SEARCH_LIMIT}
  `;

  if (ranked.length === 0) return [];
  const order = new Map(ranked.map((r, i) => [r.id, i]));

  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({ where: { id: { in: ranked.map((r) => r.id) } } }),
    categorySlugToLabel(),
  ]);
  // findMany doesn't preserve the ranking from the query above.
  return rows
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((row) => mapRow(row, labelBySlug));
}

export async function getFeaturedArticles(): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: { ...publishedWhere(), isFeatured: true },
      orderBy: { publishedAt: "desc" },
    }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const [row, labelBySlug] = await Promise.all([
    prisma.article.findFirst({ where: { slug, ...publishedWhere() } }),
    categorySlugToLabel(),
  ]);
  return row ? mapRow(row, labelBySlug) : undefined;
}

// Same category + recent first, topped up with other recent published
// articles if the category doesn't have enough on its own — a story in a
// thin category should still get a full rail of suggestions.
export async function getRelatedArticles(article: Article, limit = 6): Promise<Article[]> {
  const [sameCategoryRows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: { ...publishedWhere(), categorySlug: article.categorySlug, id: { not: article.id } },
      orderBy: { publishedAt: "desc" },
      take: limit,
    }),
    categorySlugToLabel(),
  ]);

  const related = sameCategoryRows.map((row) => mapRow(row, labelBySlug));

  if (related.length < limit) {
    const excludeIds = [article.id, ...related.map((a) => a.id)];
    const fillerRows = await prisma.article.findMany({
      where: { ...publishedWhere(), id: { notIn: excludeIds } },
      orderBy: { publishedAt: "desc" },
      take: limit - related.length,
    });
    related.push(...fillerRows.map((row) => mapRow(row, labelBySlug)));
  }

  return related;
}

// A reader's private "read later" list, newest-saved first. Doesn't
// filter by publish status — an article saved while live still shows up
// here even if it's since been unpublished (a real but rare edge case,
// not worth a broken/missing-link surprise in someone's saved list).
export async function getSavedArticlesForUser(userId: string): Promise<Article[]> {
  const [saves, labelBySlug] = await Promise.all([
    prisma.savedArticle.findMany({
      // Trashed articles are excluded even though unpublished ones aren't
      // — an unpublished story still exists and may come back, a deleted
      // one would just be a dead link in someone's list.
      where: { userId, article: { deletedAt: null } },
      orderBy: { createdAt: "desc" },
      include: { article: true },
    }),
    categorySlugToLabel(),
  ]);
  return saves.map((s) => mapRow(s.article, labelBySlug));
}

// Homepage's personalized "Recommended For You" rail — most recent
// published articles across whichever categories a reader has actually
// read the most (see getTopCategorySlugs in lib/interests.ts). Returns []
// for a reader with no reading history yet rather than falling back to
// generic "latest" picks, so the rail simply doesn't render for a brand
// new reader instead of pretending to be personalized when it isn't.
export async function getPersonalizedArticles(categorySlugs: string[], limit = 4): Promise<Article[]> {
  if (categorySlugs.length === 0) return [];
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: { ...publishedWhere(), categorySlug: { in: categorySlugs } },
      orderBy: { publishedAt: "desc" },
      take: limit,
    }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: { categorySlug, ...publishedWhere() },
      orderBy: { publishedAt: "desc" },
    }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

// --- Admin reads (all statuses, with the full category multi-select) ---

/**
 * Every non-trashed article. Pass `authorId` to scope the list to one
 * person's work — that's how an AUTHOR-role account sees only their own
 * articles without the list route needing its own filtering logic.
 */
export async function getAllArticlesAdmin(options: { authorId?: string } = {}): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: { deletedAt: null, ...(options.authorId ? { authorId: options.authorId } : {}) },
      orderBy: { updatedAt: "desc" },
      ...ARTICLE_WITH_CATEGORIES,
    }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

export async function getArticleByIdAdmin(id: number): Promise<Article | undefined> {
  const [row, labelBySlug] = await Promise.all([
    prisma.article.findUnique({ where: { id }, ...ARTICLE_WITH_CATEGORIES }),
    categorySlugToLabel(),
  ]);
  return row ? mapRow(row, labelBySlug) : undefined;
}

/**
 * Backs bulk actions' ownership check — id → authorId for a batch of
 * articles, without pulling each full row. A requested id with no
 * matching row is simply absent from the result, which the caller
 * treats the same as "not owned" (an author can't touch what doesn't
 * exist any more than what belongs to someone else).
 */
export async function getArticleAuthorIds(ids: number[]): Promise<Map<number, string | null>> {
  const rows = await prisma.article.findMany({ where: { id: { in: ids } }, select: { id: true, authorId: true } });
  return new Map(rows.map((r) => [r.id, r.authorId]));
}

/** The trash: soft-deleted articles, most recently deleted first. */
export async function getTrashedArticles(): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      ...ARTICLE_WITH_CATEGORIES,
    }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

/** Articles waiting on an editor — the dashboard's "pending approvals". */
export async function getArticlesAwaitingReview(): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: { status: "IN_REVIEW", deletedAt: null },
      orderBy: { updatedAt: "desc" },
      ...ARTICLE_WITH_CATEGORIES,
    }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

// --- Admin writes ---

async function syncArticleCategories(
  tx: Prisma.TransactionClient,
  articleId: number,
  categorySlugs: string[]
) {
  const categories = await tx.category.findMany({ where: { slug: { in: categorySlugs } } });
  await tx.articleCategory.deleteMany({ where: { articleId } });
  if (categories.length > 0) {
    await tx.articleCategory.createMany({
      data: categories.map((c) => ({ articleId, categoryId: c.id })),
    });
  }
}

export async function createArticle(input: ArticleInput): Promise<Article> {
  const status = toPrismaStatus(input.status);
  const primarySlug = input.categorySlugs[0];
  const publishedAt = input.publishedAt
    ? new Date(input.publishedAt)
    : status === "PUBLISHED"
      ? new Date()
      : null;

  const [row, labelBySlug] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const created = await tx.article.create({
        data: {
          slug: input.slug,
          categorySlug: primarySlug,
          headline: input.headline,
          dek: input.dek,
          author: input.author,
          body: input.bodyHtml,
          coverImageUrl: input.coverImageUrl,
          status,
          isFeatured: input.isFeatured,
          isExclusive: input.isExclusive,
          isBreaking: input.isBreaking,
          isLiveBlog: input.isLiveBlog,
          socialNotes: input.socialNotes,
          authorId: input.authorId ?? null,
          tags: input.tags,
          bulletPoints: input.bulletPoints,
          comparisonTitle: input.comparisonTitle,
          comparisonBody: input.comparisonBody,
          comparisonSourceLabel: input.comparisonSourceLabel,
          comparisonSourceUrl: input.comparisonSourceUrl,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          seoKeywords: input.seoKeywords,
          ogImage: input.ogImage,
          canonicalUrl: input.canonicalUrl,
          publishedAt,
        },
      });
      await syncArticleCategories(tx, created.id, input.categorySlugs);
      return tx.article.findUniqueOrThrow({ where: { id: created.id }, ...ARTICLE_WITH_CATEGORIES });
    }),
    categorySlugToLabel(),
  ]);
  return mapRow(row, labelBySlug);
}

export async function updateArticle(id: number, input: ArticleInput): Promise<Article> {
  const status = toPrismaStatus(input.status);
  const primarySlug = input.categorySlugs[0];
  const existing = await prisma.article.findUnique({ where: { id }, select: { publishedAt: true } });
  // An explicit date always wins. Otherwise: publishing with no date set
  // stamps "now" (unless it already has one), and every other status
  // preserves whatever date is already there rather than clearing it —
  // pulling a live story back to review or archiving it shouldn't destroy
  // its original publication date, since restoring it should put the
  // story back exactly as it was.
  const publishedAt = input.publishedAt
    ? new Date(input.publishedAt)
    : status === "PUBLISHED"
      ? existing?.publishedAt ?? new Date()
      : existing?.publishedAt ?? null;

  const [row, labelBySlug] = await Promise.all([
    prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: {
          slug: input.slug,
          categorySlug: primarySlug,
          headline: input.headline,
          dek: input.dek,
          author: input.author,
          body: input.bodyHtml,
          coverImageUrl: input.coverImageUrl,
          status,
          isFeatured: input.isFeatured,
          isExclusive: input.isExclusive,
          isBreaking: input.isBreaking,
          isLiveBlog: input.isLiveBlog,
          socialNotes: input.socialNotes,
          tags: input.tags,
          bulletPoints: input.bulletPoints,
          comparisonTitle: input.comparisonTitle,
          comparisonBody: input.comparisonBody,
          comparisonSourceLabel: input.comparisonSourceLabel,
          comparisonSourceUrl: input.comparisonSourceUrl,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          seoKeywords: input.seoKeywords,
          ogImage: input.ogImage,
          canonicalUrl: input.canonicalUrl,
          publishedAt,
        },
      });
      await syncArticleCategories(tx, id, input.categorySlugs);
      return tx.article.findUniqueOrThrow({ where: { id }, ...ARTICLE_WITH_CATEGORIES });
    }),
    categorySlugToLabel(),
  ]);
  return mapRow(row, labelBySlug);
}

/**
 * Soft delete — moves the article to the trash. Nothing in the CMS hard
 * deletes on a first click; purgeArticle() below is the irreversible one
 * and is only reachable from /admin/trash.
 */
export async function deleteArticle(id: number): Promise<void> {
  await prisma.article.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function restoreArticle(id: number): Promise<void> {
  await prisma.article.update({ where: { id }, data: { deletedAt: null } });
}

/** Irreversible. Cascades comments, likes, saves, revisions, live entries. */
export async function purgeArticle(id: number): Promise<void> {
  await prisma.article.delete({ where: { id } });
}

export async function emptyArticleTrash(): Promise<number> {
  const { count } = await prisma.article.deleteMany({ where: { deletedAt: { not: null } } });
  return count;
}

/**
 * "Duplicate as draft" — copies everything editable into a new DRAFT with
 * a fresh, non-colliding slug. Deliberately does NOT copy engagement or
 * lifecycle state (views, likes, comments, featured/breaking flags,
 * publish date): those belong to the original story, and a copy that
 * arrived pre-featured with someone else's view count would be wrong.
 */
export async function duplicateArticle(id: number, authorId: string | null): Promise<Article> {
  const source = await prisma.article.findUniqueOrThrow({ where: { id }, ...ARTICLE_WITH_CATEGORIES });

  // Probe for a free slug rather than trusting one attempt — "-copy" may
  // well already be taken if this is the second duplicate.
  const baseSlug = `${source.slug}-copy`.slice(0, 90);
  let slug = baseSlug;
  for (let n = 2; await prisma.article.findUnique({ where: { slug }, select: { id: true } }); n += 1) {
    slug = `${baseSlug}-${n}`;
  }

  const [row, labelBySlug] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const created = await tx.article.create({
        data: {
          slug,
          categorySlug: source.categorySlug,
          headline: `${source.headline} (copy)`.slice(0, 200),
          dek: source.dek,
          author: source.author,
          body: source.body,
          coverImageUrl: source.coverImageUrl,
          status: "DRAFT",
          authorId,
          socialNotes: source.socialNotes,
          tags: source.tags,
          bulletPoints: source.bulletPoints,
          comparisonTitle: source.comparisonTitle,
          comparisonBody: source.comparisonBody,
          comparisonSourceLabel: source.comparisonSourceLabel,
          comparisonSourceUrl: source.comparisonSourceUrl,
          seoTitle: source.seoTitle,
          seoDescription: source.seoDescription,
          seoKeywords: source.seoKeywords,
          ogImage: source.ogImage,
          // canonicalUrl is intentionally dropped: inheriting the
          // original's canonical would tell Google the copy IS the
          // original, which is exactly wrong for a new draft.
        },
      });
      await syncArticleCategories(
        tx,
        created.id,
        source.categories.map((ac) => ac.category.slug)
      );
      return tx.article.findUniqueOrThrow({ where: { id: created.id }, ...ARTICLE_WITH_CATEGORIES });
    }),
    categorySlugToLabel(),
  ]);
  return mapRow(row, labelBySlug);
}

// Fire-and-forget from the article page (see articles/[slug]/page.tsx) —
// intentionally not awaited by the caller, so a slow write never delays
// rendering the article itself. Basic performance signal only: total
// views, no per-visitor dedup/analytics — that's out of scope for "simple
// post performance view."
export async function incrementArticleViewCount(id: number): Promise<void> {
  // Today in UTC, date only — matches the DATE column and the unique
  // constraint, so a day's hits collapse into one row rather than one per
  // view. Both writes go in a transaction so the lifetime counter and the
  // daily series can't drift apart.
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction([
    prisma.article.update({ where: { id }, data: { viewCount: { increment: 1 } } }),
    prisma.articleView.upsert({
      where: { articleId_day: { articleId: id, day } },
      create: { articleId: id, day, count: 1 },
      update: { count: { increment: 1 } },
    }),
  ]);
}

// --- Quick-edit actions (articles list) ---

export async function toggleArticleFeatured(id: number, isFeatured: boolean): Promise<void> {
  await prisma.article.update({ where: { id }, data: { isFeatured } });
}

export async function toggleArticleBreaking(id: number, isBreaking: boolean): Promise<void> {
  await prisma.article.update({ where: { id }, data: { isBreaking } });
}

/** Breaking-news ticker source for the public BreakingBar. */
export async function getBreakingArticles(limit = 5): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: { ...publishedWhere(), isBreaking: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

export async function updateArticleCategories(id: number, categorySlugs: string[]): Promise<void> {
  if (categorySlugs.length === 0) throw new Error("An article needs at least one category.");
  await prisma.$transaction(async (tx) => {
    await tx.article.update({ where: { id }, data: { categorySlug: categorySlugs[0] } });
    await syncArticleCategories(tx, id, categorySlugs);
  });
}

export async function bulkSetArticleFeatured(ids: number[], isFeatured: boolean): Promise<void> {
  await prisma.article.updateMany({ where: { id: { in: ids } }, data: { isFeatured } });
}

export async function bulkUpdateArticleCategories(ids: number[], categorySlugs: string[]): Promise<void> {
  if (categorySlugs.length === 0) throw new Error("Choose at least one category.");
  await prisma.$transaction(async (tx) => {
    await tx.article.updateMany({ where: { id: { in: ids } }, data: { categorySlug: categorySlugs[0] } });
    for (const id of ids) {
      await syncArticleCategories(tx, id, categorySlugs);
    }
  });
}

export async function bulkSetArticleBreaking(ids: number[], isBreaking: boolean): Promise<void> {
  await prisma.article.updateMany({ where: { id: { in: ids } }, data: { isBreaking } });
}

export async function bulkSetArticleStatus(ids: number[], status: ArticleStatusValue): Promise<void> {
  const prismaStatus = toPrismaStatus(status);
  if (prismaStatus === "PUBLISHED") {
    // Only stamp publishedAt for rows that don't already have one — a
    // single updateMany can't express that conditionally, so two passes.
    await prisma.article.updateMany({
      where: { id: { in: ids }, publishedAt: null },
      data: { status: prismaStatus, publishedAt: new Date() },
    });
    await prisma.article.updateMany({
      where: { id: { in: ids }, publishedAt: { not: null } },
      data: { status: prismaStatus },
    });
  } else {
    await prisma.article.updateMany({ where: { id: { in: ids } }, data: { status: prismaStatus } });
  }
}

/** Soft delete — see deleteArticle(). Rows land in /admin/trash. */
export async function bulkDeleteArticles(ids: number[]): Promise<void> {
  await prisma.article.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
}

export async function bulkRestoreArticles(ids: number[]): Promise<void> {
  await prisma.article.updateMany({ where: { id: { in: ids } }, data: { deletedAt: null } });
}
