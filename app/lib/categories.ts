import { prisma } from "./prisma";
import type { NavPlacement as PrismaNavPlacement } from "@prisma/client";

export type NavPlacement = "MAIN" | "MORE" | "HIDDEN";

export type Category = {
  id: string;
  slug: string;
  label: string;
  description: string;
  color: string | null;
  navPlacement: NavPlacement;
  navOrder: number;
  shareImage: string | null;
  createdAt: string;
};

export type CategoryWithCount = Category & { articleCount: number };

export type CategoryInput = {
  name: string;
  slug: string;
  description: string;
  color: string | null;
  navPlacement: NavPlacement;
  navOrder: number;
  shareImage: string | null;
};

function mapRow(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  navPlacement: PrismaNavPlacement;
  navOrder: number;
  shareImage: string | null;
  createdAt: Date;
}): Category {
  return {
    id: row.id,
    slug: row.slug,
    label: row.name,
    description: row.description ?? "",
    color: row.color,
    navPlacement: row.navPlacement as NavPlacement,
    navOrder: row.navOrder,
    shareImage: row.shareImage,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(mapRow);
}

// The site's top-bar nav — capped at a handful of items by design (see
// SiteHeaderClient.tsx's "Featured" + up to 5 MAIN categories + "More"
// = 7-item structure the nav was scoped to). This query itself doesn't
// enforce a limit — that's an editorial choice made from
// /admin/categories, not a hardcoded slice — but MAIN is meant to stay
// small; anything else belongs in MORE.
export async function getMainNavCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { navPlacement: "MAIN" },
    orderBy: [{ navOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(mapRow);
}

// The "More" dropdown (desktop) / secondary section (mobile drawer).
export async function getMoreNavCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { navPlacement: "MORE" },
    orderBy: [{ navOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(mapRow);
}

// SiteFooter's "Sections" list — every category actually reachable from
// nav (MAIN or MORE), not just MAIN, since the footer is a full sitemap
// rather than the space-constrained top bar.
export async function getFooterNavCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { navPlacement: { in: ["MAIN", "MORE"] } },
    orderBy: [{ navPlacement: "asc" }, { navOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(mapRow);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const row = await prisma.category.findUnique({ where: { slug } });
  return row ? mapRow(row) : undefined;
}

// --- Admin: list with article counts, and full CRUD ---

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const [rows, counts] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ navPlacement: "asc" }, { navOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.article.groupBy({ by: ["categorySlug"], _count: { _all: true } }),
  ]);
  const countBySlug = new Map(counts.map((c) => [c.categorySlug, c._count._all]));
  return rows.map((row) => ({ ...mapRow(row), articleCount: countBySlug.get(row.slug) ?? 0 }));
}

export async function getCategoryArticleCount(slug: string): Promise<number> {
  return prisma.article.count({ where: { categorySlug: slug } });
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const row = await prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      color: input.color,
      navPlacement: input.navPlacement,
      navOrder: input.navOrder,
      shareImage: input.shareImage,
    },
  });
  return mapRow(row);
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  const existing = await prisma.category.findUniqueOrThrow({ where: { id } });

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.category.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        color: input.color,
        navPlacement: input.navPlacement,
        navOrder: input.navOrder,
        shareImage: input.shareImage,
      },
    });

    // The site's article editor still stores a single primary category as
    // plain text (Article.categorySlug, not a foreign key — see schema
    // comment). Renaming a category's slug would silently orphan every
    // article filed under the old slug, so cascade the rename here.
    if (existing.slug !== input.slug) {
      await tx.article.updateMany({
        where: { categorySlug: existing.slug },
        data: { categorySlug: input.slug },
      });
    }

    return updated;
  });

  return mapRow(row);
}

export async function deleteCategory(id: string): Promise<void> {
  await prisma.category.delete({ where: { id } });
}
