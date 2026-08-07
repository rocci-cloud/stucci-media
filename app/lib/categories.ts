import { prisma } from "./prisma";

export type Category = {
  id: string;
  slug: string;
  label: string;
  description: string;
  color: string | null;
};

function mapRow(row: { id: string; slug: string; name: string; description: string | null; color: string | null }): Category {
  return {
    id: row.id,
    slug: row.slug,
    label: row.name,
    description: row.description ?? "",
    color: row.color,
  };
}

export async function getCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(mapRow);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const row = await prisma.category.findUnique({ where: { slug } });
  return row ? mapRow(row) : undefined;
}
