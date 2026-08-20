import { prisma } from "./prisma";
import { slugify } from "./slugify";

export type Author = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
};

export type AuthorInput = {
  name: string;
  slug: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
};

/** The canonical slug for a byline string, so URLs and lookups agree. */
export function authorSlug(name: string): string {
  return slugify(name);
}

type AuthorRow = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
};

function mapAuthor(row: AuthorRow): Author {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    websiteUrl: row.websiteUrl,
    twitterUrl: row.twitterUrl,
    facebookUrl: row.facebookUrl,
  };
}

/**
 * Every byline that appears on a published article, with a story count and
 * the saved profile where one exists.
 *
 * Bylines come from the articles themselves, not from the authors table — an
 * author who has never had a profile filled in still gets a page, and a
 * profile row with no published articles behind it doesn't appear as though
 * it does.
 */
export async function getBylinesWithCounts(): Promise<
  Array<{ slug: string; name: string; count: number; profile: Author | null }>
> {
  const [rows, profiles] = await Promise.all([
    prisma.article.groupBy({
      by: ["author"],
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() }, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.author.findMany(),
  ]);

  const profileBySlug = new Map(profiles.map((p) => [p.slug, mapAuthor(p)]));
  const bySlug = new Map<string, { slug: string; name: string; count: number; profile: Author | null }>();

  for (const row of rows) {
    const name = row.author?.trim();
    if (!name) continue;
    const slug = authorSlug(name);
    if (!slug) continue;
    const existing = bySlug.get(slug);
    if (existing) {
      // Two spellings of the same byline collapse to one page.
      existing.count += row._count._all;
      continue;
    }
    bySlug.set(slug, {
      slug,
      name: profileBySlug.get(slug)?.name ?? name,
      count: row._count._all,
      profile: profileBySlug.get(slug) ?? null,
    });
  }

  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const row = await prisma.author.findUnique({ where: { slug } });
  return row ? mapAuthor(row) : null;
}

export async function getAllAuthorProfiles(): Promise<Author[]> {
  const rows = await prisma.author.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapAuthor);
}

export async function createAuthor(input: AuthorInput): Promise<Author> {
  const row = await prisma.author.create({ data: normalize(input) });
  return mapAuthor(row);
}

export async function updateAuthor(id: string, input: AuthorInput): Promise<Author> {
  const row = await prisma.author.update({ where: { id }, data: normalize(input) });
  return mapAuthor(row);
}

export async function deleteAuthor(id: string): Promise<void> {
  await prisma.author.delete({ where: { id } });
}

// Empty strings from a form should clear the field, not store "".
function normalize(input: AuthorInput) {
  const blankToNull = (v: string | null | undefined) => {
    const t = (v ?? "").trim();
    return t === "" ? null : t;
  };
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    title: blankToNull(input.title),
    bio: blankToNull(input.bio),
    avatarUrl: blankToNull(input.avatarUrl),
    websiteUrl: blankToNull(input.websiteUrl),
    twitterUrl: blankToNull(input.twitterUrl),
    facebookUrl: blankToNull(input.facebookUrl),
  };
}
