import { sql } from "./db";
import { getCategoryBySlug } from "./categories";

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

type ArticleRow = {
  id: number;
  slug: string;
  category_slug: string;
  headline: string;
  dek: string;
  author: string;
  body: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const WORDS_PER_MINUTE = 200;

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateReadTime(bodyHtml: string) {
  const text = bodyHtml.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

function mapRow(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    categorySlug: row.category_slug,
    category: getCategoryBySlug(row.category_slug)?.label ?? row.category_slug,
    headline: row.headline,
    dek: row.dek,
    author: row.author,
    date: formatDate(row.published_at ?? row.created_at),
    readTime: estimateReadTime(row.body),
    bodyHtml: row.body,
    coverImageUrl: row.cover_image_url,
    status: row.status,
  };
}

// --- Public reads (published only) ---

export async function getPublishedArticles(): Promise<Article[]> {
  const rows = (await sql`
    select * from articles where status = 'published' order by published_at desc
  `) as ArticleRow[];
  return rows.map(mapRow);
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const rows = (await sql`
    select * from articles where slug = ${slug} and status = 'published' limit 1
  `) as ArticleRow[];
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
  const rows = (await sql`
    select * from articles where category_slug = ${categorySlug} and status = 'published' order by published_at desc
  `) as ArticleRow[];
  return rows.map(mapRow);
}

// --- Admin reads (all statuses) ---

export async function getAllArticlesAdmin(): Promise<Article[]> {
  const rows = (await sql`
    select * from articles order by updated_at desc
  `) as ArticleRow[];
  return rows.map(mapRow);
}

export async function getArticleByIdAdmin(id: number): Promise<Article | undefined> {
  const rows = (await sql`select * from articles where id = ${id} limit 1`) as ArticleRow[];
  return rows[0] ? mapRow(rows[0]) : undefined;
}

// --- Admin writes ---

export async function createArticle(input: ArticleInput): Promise<Article> {
  const rows = (await sql`
    insert into articles (slug, category_slug, headline, dek, author, body, cover_image_url, status, published_at)
    values (
      ${input.slug}, ${input.categorySlug}, ${input.headline}, ${input.dek}, ${input.author},
      ${input.bodyHtml}, ${input.coverImageUrl}, ${input.status},
      case when ${input.status} = 'published' then now() else null end
    )
    returning *
  `) as ArticleRow[];
  return mapRow(rows[0]);
}

export async function updateArticle(id: number, input: ArticleInput): Promise<Article> {
  const rows = (await sql`
    update articles set
      slug = ${input.slug},
      category_slug = ${input.categorySlug},
      headline = ${input.headline},
      dek = ${input.dek},
      author = ${input.author},
      body = ${input.bodyHtml},
      cover_image_url = ${input.coverImageUrl},
      status = ${input.status},
      published_at = case
        when ${input.status} = 'published' and published_at is null then now()
        when ${input.status} = 'published' then published_at
        else null
      end,
      updated_at = now()
    where id = ${id}
    returning *
  `) as ArticleRow[];
  return mapRow(rows[0]);
}

export async function deleteArticle(id: number): Promise<void> {
  await sql`delete from articles where id = ${id}`;
}
