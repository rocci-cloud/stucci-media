import { prisma } from "./prisma";
import { getCategories } from "./categories";
import type { Article as PrismaArticle, ArticleStatus, Prisma } from "@prisma/client";

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
  status: "draft" | "published";
  isFeatured: boolean;
  viewCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  publishedAt: string | null; // raw ISO, for the date picker — `date` above is the formatted display version
};

export type ArticleInput = {
  slug: string;
  categorySlugs: string[]; // first entry is the legacy primary category
  headline: string;
  dek: string;
  author: string;
  bodyHtml: string; // sanitized HTML — rendered as-is via dangerouslySetInnerHTML
  coverImageUrl: string | null;
  status: "draft" | "published";
  isFeatured: boolean;
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

function toStatus(status: ArticleStatus): "draft" | "published" {
  return status === "PUBLISHED" ? "published" : "draft";
}

function toPrismaStatus(status: "draft" | "published"): ArticleStatus {
  return status === "published" ? "PUBLISHED" : "DRAFT";
}

async function categorySlugToLabel(): Promise<Map<string, string>> {
  const cats = await getCategories();
  return new Map(cats.map((c) => [c.slug, c.label]));
}

function mapRow(row: PrismaArticle | ArticleWithCategories, labelBySlug: Map<string, string>): Article {
  const categorySlugs =
    "categories" in row ? row.categories.map((ac) => ac.category.slug) : [row.categorySlug];
  const categories = categorySlugs.map((slug) => labelBySlug.get(slug) ?? slug);

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
    viewCount: row.viewCount,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoKeywords: row.seoKeywords,
    ogImage: row.ogImage,
    canonicalUrl: row.canonicalUrl,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  };
}

// --- Public reads (published only) ---

export async function getPublishedArticles(): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const [row, labelBySlug] = await Promise.all([
    prisma.article.findFirst({ where: { slug, status: "PUBLISHED" } }),
    categorySlugToLabel(),
  ]);
  return row ? mapRow(row, labelBySlug) : undefined;
}

export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({
      where: { categorySlug, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
    }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

// --- Admin reads (all statuses, with the full category multi-select) ---

export async function getAllArticlesAdmin(): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({ orderBy: { updatedAt: "desc" }, ...ARTICLE_WITH_CATEGORIES }),
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
  const publishedAt = input.publishedAt
    ? new Date(input.publishedAt)
    : status === "PUBLISHED"
      ? existing?.publishedAt ?? new Date()
      : null;

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

export async function deleteArticle(id: number): Promise<void> {
  await prisma.article.delete({ where: { id } });
}

// --- Quick-edit actions (articles list) ---

export async function toggleArticleFeatured(id: number, isFeatured: boolean): Promise<void> {
  await prisma.article.update({ where: { id }, data: { isFeatured } });
}

export async function updateArticleCategories(id: number, categorySlugs: string[]): Promise<void> {
  if (categorySlugs.length === 0) throw new Error("An article needs at least one category.");
  await prisma.$transaction(async (tx) => {
    await tx.article.update({ where: { id }, data: { categorySlug: categorySlugs[0] } });
    await syncArticleCategories(tx, id, categorySlugs);
  });
}

export async function bulkSetArticleStatus(ids: number[], status: "draft" | "published"): Promise<void> {
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

export async function bulkDeleteArticles(ids: number[]): Promise<void> {
  await prisma.article.deleteMany({ where: { id: { in: ids } } });
}
