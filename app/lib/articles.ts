import { prisma } from "./prisma";
import { getCategories } from "./categories";
import type { Article as PrismaArticle, ArticleStatus } from "@prisma/client";

export type Article = {
  id: number;
  slug: string;
  categorySlug: string;
  category: string;
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
};

export type ArticleInput = {
  slug: string;
  categorySlug: string;
  headline: string;
  dek: string;
  author: string;
  bodyHtml: string; // sanitized HTML — rendered as-is via dangerouslySetInnerHTML
  coverImageUrl: string | null;
  status: "draft" | "published";
};

const WORDS_PER_MINUTE = 200;

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

function mapRow(row: PrismaArticle, labelBySlug: Map<string, string>): Article {
  return {
    id: row.id,
    slug: row.slug,
    categorySlug: row.categorySlug,
    category: labelBySlug.get(row.categorySlug) ?? row.categorySlug,
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

// --- Admin reads (all statuses) ---

export async function getAllArticlesAdmin(): Promise<Article[]> {
  const [rows, labelBySlug] = await Promise.all([
    prisma.article.findMany({ orderBy: { updatedAt: "desc" } }),
    categorySlugToLabel(),
  ]);
  return rows.map((row) => mapRow(row, labelBySlug));
}

export async function getArticleByIdAdmin(id: number): Promise<Article | undefined> {
  const [row, labelBySlug] = await Promise.all([
    prisma.article.findUnique({ where: { id } }),
    categorySlugToLabel(),
  ]);
  return row ? mapRow(row, labelBySlug) : undefined;
}

// --- Admin writes ---

export async function createArticle(input: ArticleInput): Promise<Article> {
  const status = toPrismaStatus(input.status);
  const [row, labelBySlug] = await Promise.all([
    prisma.article.create({
      data: {
        slug: input.slug,
        categorySlug: input.categorySlug,
        headline: input.headline,
        dek: input.dek,
        author: input.author,
        body: input.bodyHtml,
        coverImageUrl: input.coverImageUrl,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    }),
    categorySlugToLabel(),
  ]);
  return mapRow(row, labelBySlug);
}

export async function updateArticle(id: number, input: ArticleInput): Promise<Article> {
  const status = toPrismaStatus(input.status);
  const existing = await prisma.article.findUnique({ where: { id }, select: { publishedAt: true } });
  const publishedAt = status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : null;

  const [row, labelBySlug] = await Promise.all([
    prisma.article.update({
      where: { id },
      data: {
        slug: input.slug,
        categorySlug: input.categorySlug,
        headline: input.headline,
        dek: input.dek,
        author: input.author,
        body: input.bodyHtml,
        coverImageUrl: input.coverImageUrl,
        status,
        publishedAt,
      },
    }),
    categorySlugToLabel(),
  ]);
  return mapRow(row, labelBySlug);
}

export async function deleteArticle(id: number): Promise<void> {
  await prisma.article.delete({ where: { id } });
}
