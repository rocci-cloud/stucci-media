import { prisma } from "./prisma";
import type { Comment as PrismaComment, User } from "@prisma/client";

export type CommentNode = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  parentId: string | null;
  isApproved: boolean;
  isPinned: boolean;
  replies: CommentNode[];
};

export type AdminComment = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorEmail: string;
  isApproved: boolean;
  isPinned: boolean;
  // What the comment is attached to. One queue moderates both articles and
  // podcast episodes, so the row has to say which — and link to the right
  // public page.
  targetKind: "article" | "episode";
  targetTitle: string;
  targetHref: string;
};

type CommentRow = PrismaComment & { user: User };

function mapRow(row: CommentRow): CommentNode {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    authorId: row.userId,
    authorName: row.user.name,
    authorImage: row.user.image,
    parentId: row.parentId,
    isApproved: row.isApproved,
    isPinned: row.isPinned,
    replies: [],
  };
}

// Comments are auto-approved on submit (see createComment) — isApproved is
// used for post-moderation (an admin taking something down), not a queue
// new comments wait in. So this only needs to filter out anything an admin
// has since unapproved.
//
// Pinned top-level comments ("Editor's Picks") sort first, then everything
// else stays in posting order — pinning only reorders roots, replies stay
// chronological under whichever parent they belong to either way.
function buildTree(rows: CommentRow[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  for (const row of rows) byId.set(row.id, mapRow(row));

  const roots: CommentNode[] = [];
  for (const row of rows) {
    const node = byId.get(row.id)!;
    const parent = row.parentId ? byId.get(row.parentId) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  roots.sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  return roots;
}

export async function getApprovedCommentsForArticle(articleId: number): Promise<CommentNode[]> {
  const rows = await prisma.comment.findMany({
    where: { articleId, isApproved: true },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return buildTree(rows);
}

export async function getCommentCount(articleId: number): Promise<number> {
  return prisma.comment.count({ where: { articleId, isApproved: true } });
}

/**
 * Approved-comment counts for many articles in one query.
 *
 * The homepage renders up to ~30 cards; calling getCommentCount per card
 * would be ~30 round trips to fill a meta row. This is one groupBy, and
 * articles with no comments are simply absent from the map rather than
 * carrying a zero.
 */
export async function getCommentCountsForArticles(
  articleIds: number[],
): Promise<Map<number, number>> {
  if (articleIds.length === 0) return new Map();
  // Annotated explicitly rather than inferred: groupBy's return type is
  // generated, and this file already cannot resolve it in environments
  // where `prisma generate` has not run. The shape is stable and narrow.
  type CountRow = { articleId: number | null; _count: { _all: number } };
  const rows = (await prisma.comment.groupBy({
    by: ["articleId"],
    where: { articleId: { in: articleIds }, isApproved: true },
    _count: { _all: true },
  })) as unknown as CountRow[];

  const counts = new Map<number, number>();
  for (const row of rows) {
    if (row.articleId !== null) counts.set(row.articleId, row._count._all);
  }
  return counts;
}

export async function createComment(input: {
  articleId: number;
  userId: string;
  content: string;
  parentId: string | null;
}): Promise<CommentNode> {
  const row = await prisma.comment.create({
    data: {
      articleId: input.articleId,
      userId: input.userId,
      content: input.content,
      parentId: input.parentId,
      isApproved: true,
    },
    include: { user: true },
  });
  return mapRow(row);
}

/**
 * The same thread machinery, pointed at a podcast episode.
 *
 * Deliberately thin wrappers over the article versions rather than a
 * parallel implementation: tree building, pin ordering and approval are
 * identical, and the admin moderation queue reads both from one table.
 */
export async function getApprovedCommentsForEpisode(episodeId: string): Promise<CommentNode[]> {
  const rows = await prisma.comment.findMany({
    where: { podcastEpisodeId: episodeId, isApproved: true },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return buildTree(rows);
}

export async function getEpisodeCommentCount(episodeId: string): Promise<number> {
  return prisma.comment.count({ where: { podcastEpisodeId: episodeId, isApproved: true } });
}

export async function createEpisodeComment(input: {
  episodeId: string;
  userId: string;
  content: string;
  parentId: string | null;
}): Promise<CommentNode> {
  const row = await prisma.comment.create({
    data: {
      podcastEpisodeId: input.episodeId,
      userId: input.userId,
      content: input.content,
      parentId: input.parentId,
      isApproved: true,
    },
    include: { user: true },
  });
  return mapRow(row);
}

// --- Admin moderation ---

export async function getAllCommentsAdmin(): Promise<AdminComment[]> {
  const rows = await prisma.comment.findMany({
    include: {
      user: true,
      article: { select: { slug: true, headline: true } },
      episode: { select: { slug: true, title: true, podcast: { select: { slug: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => {
    const target = row.episode
      ? {
          targetKind: "episode" as const,
          targetTitle: row.episode.title,
          targetHref: `/podcasts/${row.episode.podcast.slug}/${row.episode.slug}`,
        }
      : {
          targetKind: "article" as const,
          targetTitle: row.article?.headline ?? "(deleted)",
          targetHref: row.article ? `/articles/${row.article.slug}` : "#",
        };
    return {
      id: row.id,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      authorName: row.user.name,
      authorEmail: row.user.email,
      isApproved: row.isApproved,
      isPinned: row.isPinned,
      ...target,
    };
  });
}

export async function setCommentApproved(id: string, isApproved: boolean): Promise<void> {
  await prisma.comment.update({ where: { id }, data: { isApproved } });
}

// "Editor's Pick" — pinning a reply is allowed (no parentId check) but
// only affects display order for top-level comments; buildTree only
// re-sorts roots, so pinning a reply just marks it without moving it.
export async function setCommentPinned(id: string, isPinned: boolean): Promise<void> {
  await prisma.comment.update({ where: { id }, data: { isPinned } });
}

export async function deleteCommentAdmin(id: string): Promise<void> {
  await prisma.comment.delete({ where: { id } });
}

// Short preview for activity-log labels — not meant for display anywhere else.
export async function getCommentPreview(id: string): Promise<string | null> {
  const row = await prisma.comment.findUnique({ where: { id }, select: { content: true } });
  if (!row) return null;
  return row.content.length > 60 ? `${row.content.slice(0, 60)}…` : row.content;
}
