import { prisma } from "./prisma";

export type Category = {
  id: string;
  slug: string;
  label: string;
  description: string;
  color: string | null;
  showInNav: boolean;
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
  showInNav: boolean;
  navOrder: number;
  shareImage: string | null;
};

function mapRow(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  showInNav: boolean;
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
    showInNav: row.showInNav,
    navOrder: row.navOrder,
    shareImage: row.shareImage,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(mapRow);
}

// The site's actual nav (SiteHeader, MobileMenu, SiteFooter) — showInNav
// categories only, in the admin's chosen order. Nav visibility/order is
// now real editorial control instead of a hardcoded list that had to be
// hand-kept in sync with the category table.
export async function getNavCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { showInNav: true },
    orderBy: [{ navOrder: "asc" }, { name: "asc" }],
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
    prisma.category.findMany({ orderBy: [{ navOrder: "asc" }, { createdAt: "asc" }] }),
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
      showInNav: input.showInNav,
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
        showInNav: input.showInNav,
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
