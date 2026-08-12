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
  articleSlug: string;
  articleHeadline: string;
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

// --- Admin moderation ---

export async function getAllCommentsAdmin(): Promise<AdminComment[]> {
  const rows = await prisma.comment.findMany({
    include: { user: true, article: { select: { slug: true, headline: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    authorName: row.user.name,
    authorEmail: row.user.email,
    isApproved: row.isApproved,
    isPinned: row.isPinned,
    articleSlug: row.article.slug,
    articleHeadline: row.article.headline,
  }));
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
