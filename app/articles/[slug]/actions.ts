"use server";

import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { toggleLike } from "../../lib/likes";
import { createComment, type CommentNode } from "../../lib/comments";

async function requireSession() {
  return auth.api.getSession({ headers: await headers() });
}

export type LikeActionResult =
  | { success: true; liked: boolean; count: number }
  | { success: false; error: string };

export async function toggleLikeAction(articleId: number): Promise<LikeActionResult> {
  const session = await requireSession();
  if (!session) return { success: false, error: "Sign in to like articles." };

  const result = await toggleLike(articleId, session.user.id);
  return { success: true, ...result };
}

export type CommentActionResult =
  | { success: true; comment: CommentNode }
  | { success: false; error: string };

const MAX_COMMENT_LENGTH = 2000;

export async function createCommentAction(
  articleId: number,
  content: string,
  parentId: string | null
): Promise<CommentActionResult> {
  const session = await requireSession();
  if (!session) return { success: false, error: "Sign in to join the conversation." };

  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "Comment can't be empty." };
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return { success: false, error: `Comments are limited to ${MAX_COMMENT_LENGTH} characters.` };
  }

  const comment = await createComment({
    articleId,
    userId: session.user.id,
    content: trimmed,
    parentId,
  });

  return { success: true, comment };
}
