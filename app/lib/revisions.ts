import { prisma } from "./prisma";

export type ArticleRevision = {
  id: string;
  articleId: number;
  headline: string;
  dek: string;
  body: string;
  authorName: string;
  authorEmail: string;
  isAutosave: boolean;
  note: string | null;
  createdAt: string;
};

// How many revisions we keep per article. Deep enough to cover a day of
// heavy editing, shallow enough that a long-lived article's history table
// doesn't grow without bound. Trimming happens on write (see
// recordRevision) rather than in a scheduled job — there's no cron in this
// app, and doing it inline keeps the invariant simple.
const MAX_REVISIONS_PER_ARTICLE = 50;

function mapRow(row: {
  id: string;
  articleId: number;
  headline: string;
  dek: string;
  body: string;
  authorName: string;
  authorEmail: string;
  isAutosave: boolean;
  note: string | null;
  createdAt: Date;
}): ArticleRevision {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

/**
 * Snapshot an article's editable content. No-ops when the content is
 * byte-identical to the newest existing revision — otherwise every
 * autosave tick and every "save" that only changed an SEO field would
 * add a meaningless entry the history viewer then has to hide.
 */
export async function recordRevision(input: {
  articleId: number;
  headline: string;
  dek: string;
  body: string;
  authorName: string;
  authorEmail: string;
  isAutosave?: boolean;
  note?: string | null;
}): Promise<void> {
  const latest = await prisma.articleRevision.findFirst({
    where: { articleId: input.articleId },
    orderBy: { createdAt: "desc" },
    select: { headline: true, dek: true, body: true },
  });

  if (
    latest &&
    latest.headline === input.headline &&
    latest.dek === input.dek &&
    latest.body === input.body
  ) {
    return;
  }

  await prisma.articleRevision.create({
    data: {
      articleId: input.articleId,
      headline: input.headline,
      dek: input.dek,
      body: input.body,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      isAutosave: input.isAutosave ?? false,
      note: input.note ?? null,
    },
  });

  // Trim the tail. Uses the id list from a bounded query rather than a
  // raw "delete where created_at < (offset 50)" so it stays a plain
  // Prisma call against the HTTP driver.
  const keep = await prisma.articleRevision.findMany({
    where: { articleId: input.articleId },
    orderBy: { createdAt: "desc" },
    take: MAX_REVISIONS_PER_ARTICLE,
    select: { id: true },
  });
  if (keep.length === MAX_REVISIONS_PER_ARTICLE) {
    await prisma.articleRevision.deleteMany({
      where: { articleId: input.articleId, id: { notIn: keep.map((r) => r.id) } },
    });
  }
}

export async function getRevisions(articleId: number): Promise<ArticleRevision[]> {
  const rows = await prisma.articleRevision.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapRow);
}

export async function getRevision(id: string): Promise<ArticleRevision | undefined> {
  const row = await prisma.articleRevision.findUnique({ where: { id } });
  return row ? mapRow(row) : undefined;
}

// --- Diffing ---

export type DiffLine = { type: "same" | "added" | "removed"; text: string };

/**
 * Strips tags to compare what an editor actually wrote, not the markup
 * around it — a diff that highlights every changed `<p>` wrapper is noise.
 * Block-level tags become line breaks so paragraphs stay separate lines.
 */
function htmlToLines(html: string): string[] {
  return html
    .replace(/<\/(p|h[1-6]|li|blockquote|div|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Classic LCS line diff. The inputs here are one article's paragraphs
 * (tens of lines, not thousands), so the O(n*m) table is the right
 * trade — it's exact, and it's ~50 lines instead of a dependency.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = htmlToLines(before);
  const b = htmlToLines(after);

  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ type: "removed", text: a[i] });
      i += 1;
    } else {
      out.push({ type: "added", text: b[j] });
      j += 1;
    }
  }
  while (i < a.length) out.push({ type: "removed", text: a[i++] });
  while (j < b.length) out.push({ type: "added", text: b[j++] });

  return out;
}
