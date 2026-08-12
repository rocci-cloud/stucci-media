"use server";

import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { toggleLike } from "../../lib/likes";
import { toggleSaved } from "../../lib/saved-articles";
import { createComment, type CommentNode } from "../../lib/comments";

async function requireSession() {
  return auth.api.getSession({ headers: await headers() });
}

// Engagement actions accept an articleId straight from the client, so a
// tampered request could pass an id for a draft or nonexistent article —
// verify it's a real, published article before writing anything.
async function requirePublishedArticle(articleId: number) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, status: true },
  });
  return article && article.status === "PUBLISHED" ? article : null;
}

export type LikeActionResult =
  | { success: true; liked: boolean; count: number }
  | { success: false; error: string };

export async function toggleLikeAction(articleId: number): Promise<LikeActionResult> {
  const session = await requireSession();
  if (!session) return { success: false, error: "Sign in to like articles." };

  if (!(await requirePublishedArticle(articleId))) {
    return { success: false, error: "This article is no longer available." };
  }

  try {
    const result = await toggleLike(articleId, session.user.id);
    return { success: true, ...result };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type SaveActionResult = { success: true; saved: boolean } | { success: false; error: string };

export async function toggleSaveAction(articleId: number): Promise<SaveActionResult> {
  const session = await requireSession();
  if (!session) return { success: false, error: "Sign in to save articles." };

  if (!(await requirePublishedArticle(articleId))) {
    return { success: false, error: "This article is no longer available." };
  }

  try {
    const result = await toggleSaved(articleId, session.user.id);
    return { success: true, ...result };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type CommentActionResult =
  | { success: true; comment: CommentNode }
  | { success: false; error: string };

const MAX_COMMENT_LENGTH = 2000;
const MIN_COMMENT_LENGTH = 2;

export async function createCommentAction(
  articleId: number,
  content: string,
  parentId: string | null
): Promise<CommentActionResult> {
  const session = await requireSession();
  if (!session) return { success: false, error: "Sign in to join the conversation." };

  const trimmed = content.trim();
  if (trimmed.length < MIN_COMMENT_LENGTH) return { success: false, error: "Comment is too short." };
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return { success: false, error: `Comments are limited to ${MAX_COMMENT_LENGTH} characters.` };
  }

  if (!(await requirePublishedArticle(articleId))) {
    return { success: false, error: "This article is no longer available." };
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { articleId: true } });
    if (!parent || parent.articleId !== articleId) {
      return { success: false, error: "That comment no longer exists." };
    }
  }

  try {
    const comment = await createComment({
      articleId,
      userId: session.user.id,
      content: trimmed,
      parentId,
    });
    return { success: true, comment };
  } catch {
    return { success: false, error: "Something went wrong posting your comment. Please try again." };
  }
}
