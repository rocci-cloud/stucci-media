"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, Loader2 } from "lucide-react";
import { createCommentAction } from "./actions";
import type { CommentNode } from "../../lib/comments";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function countAll(nodes: CommentNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countAll(n.replies), 0);
}

function insertReply(nodes: CommentNode[], parentId: string | null, newNode: CommentNode): CommentNode[] {
  if (parentId === null) return [...nodes, newNode];
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, replies: [...n.replies, newNode] }
      : { ...n, replies: insertReply(n.replies, parentId, newNode) }
  );
}

type CurrentUser = { id: string; name: string; image: string | null };

export default function CommentSection({
  articleId,
  initialComments,
  currentUser,
  signInRedirect,
}: {
  articleId: number;
  initialComments: CommentNode[];
  currentUser: CurrentUser | null;
  signInRedirect: string;
}) {
  const [comments, setComments] = useState(initialComments);
  const [optimisticComments, applyOptimistic] = useOptimistic(
    comments,
    (state, action: { parentId: string | null; node: CommentNode }) =>
      insertReply(state, action.parentId, action.node)
  );

  const total = countAll(optimisticComments);

  return (
    <section className="mt-14 pt-10 border-t-4 border-[var(--color-navy)]">
      <div className="flex items-center gap-2.5 mb-6">
        <MessageCircle className="h-5 w-5 text-[var(--color-red)]" />
        <h2 className="font-headline uppercase font-bold text-[20px] sm:text-[24px] tracking-[-0.005em]">
          {total > 0 ? `${total} Comment${total === 1 ? "" : "s"}` : "Comments"}
        </h2>
      </div>

      {currentUser ? (
        <CommentForm
          articleId={articleId}
          parentId={null}
          currentUser={currentUser}
          onOptimisticAdd={(node) => applyOptimistic({ parentId: null, node })}
          onCommitted={(node) => setComments((prev) => insertReply(prev, null, node))}
        />
      ) : (
        <div className="rounded-card border border-[var(--color-hairline)] bg-[var(--color-bg-off)] px-5 py-4 mb-8 font-sans text-[14px] text-[var(--color-gray)]">
          <Link
            href={`/login?from=${encodeURIComponent(signInRedirect)}`}
            className="font-bold text-[var(--color-red)] hover:underline"
          >
            Sign in
          </Link>{" "}
          to join the conversation.
        </div>
      )}

      {optimisticComments.length === 0 ? (
        <p className="font-sans text-[14px] text-[var(--color-gray)] mt-6">
          No comments yet — be the first to weigh in.
        </p>
      ) : (
        <ul className="flex flex-col gap-6 mt-8">
          {optimisticComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
              currentUser={currentUser}
              signInRedirect={signInRedirect}
              onOptimisticAdd={(parentId, node) => applyOptimistic({ parentId, node })}
              onCommitted={(parentId, node) => setComments((prev) => insertReply(prev, parentId, node))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  articleId,
  currentUser,
  signInRedirect,
  onOptimisticAdd,
  onCommitted,
  depth = 0,
}: {
  comment: CommentNode;
  articleId: number;
  currentUser: CurrentUser | null;
  signInRedirect: string;
  onOptimisticAdd: (parentId: string, node: CommentNode) => void;
  onCommitted: (parentId: string, node: CommentNode) => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const isTemp = comment.id.startsWith("temp-");

  return (
    <li className={depth > 0 ? "pl-4 sm:pl-6 border-l-2 border-[var(--color-hairline)]" : ""}>
      <div className={`flex gap-3 ${isTemp ? "opacity-60" : ""}`}>
        {comment.authorImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.authorImage}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-[12px] font-bold text-white">
            {getInitials(comment.authorName)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 font-sans">
            <span className="text-[13.5px] font-bold text-[var(--color-text)]">{comment.authorName}</span>
            <span className="text-[12px] text-[var(--color-gray-light)]">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="mt-1 font-sans text-[14.5px] leading-[1.55] text-[var(--color-text)] whitespace-pre-wrap">
            {comment.content}
          </p>
          {currentUser && !isTemp && (
            <button
              type="button"
              onClick={() => setReplying((v) => !v)}
              className="mt-1.5 font-sans text-[12.5px] font-bold text-[var(--color-gray)] hover:text-[var(--color-red)] min-h-11 sm:min-h-0"
            >
              {replying ? "Cancel" : "Reply"}
            </button>
          )}

          {replying && currentUser && (
            <div className="mt-3">
              <CommentForm
                articleId={articleId}
                parentId={comment.id}
                currentUser={currentUser}
                autoFocus
                compact
                onOptimisticAdd={(node) => onOptimisticAdd(comment.id, node)}
                onCommitted={(node) => {
                  onCommitted(comment.id, node);
                  setReplying(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <ul className="flex flex-col gap-5 mt-5">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              articleId={articleId}
              currentUser={currentUser}
              signInRedirect={signInRedirect}
              onOptimisticAdd={onOptimisticAdd}
              onCommitted={onCommitted}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// Mirrors MIN_COMMENT_LENGTH/MAX_COMMENT_LENGTH in actions.ts — the server
// is the real enforcement, this is just so a user sees the limit before
// hitting a rejected submit instead of after.
const MIN_COMMENT_LENGTH = 2;
const MAX_COMMENT_LENGTH = 2000;

function CommentForm({
  articleId,
  parentId,
  currentUser,
  onOptimisticAdd,
  onCommitted,
  autoFocus,
  compact,
}: {
  articleId: number;
  parentId: string | null;
  currentUser: CurrentUser;
  onOptimisticAdd: (node: CommentNode) => void;
  onCommitted: (node: CommentNode) => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const trimmedLength = content.trim().length;
  const tooShort = trimmedLength > 0 && trimmedLength < MIN_COMMENT_LENGTH;
  const nearLimit = content.length > MAX_COMMENT_LENGTH - 200;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < MIN_COMMENT_LENGTH || trimmed.length > MAX_COMMENT_LENGTH) return;
    setError(null);

    const tempNode: CommentNode = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorImage: currentUser.image,
      parentId,
      isApproved: true,
      replies: [],
    };

    startTransition(async () => {
      onOptimisticAdd(tempNode);
      setContent("");
      const result = await createCommentAction(articleId, trimmed, parentId);
      if (result.success) {
        onCommitted(result.comment);
      } else {
        setError(result.error);
        setContent(trimmed);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {error && <p className="text-[12px] text-[var(--color-red)]">{error}</p>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus={autoFocus}
        required
        maxLength={MAX_COMMENT_LENGTH}
        rows={compact ? 2 : 3}
        placeholder={parentId ? "Write a reply…" : "Share your thoughts…"}
        className="w-full rounded-control border border-[var(--color-hairline-strong)] px-3.5 py-3 font-sans text-[14px] resize-y focus:border-[var(--color-red)] transition-colors outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={isPending || tooShort || trimmedLength === 0}
          className="min-h-11 inline-flex items-center gap-2 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[13px] font-bold uppercase tracking-wide px-5 rounded-control transition active:scale-[0.97] disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {parentId ? "Post Reply" : "Post Comment"}
        </button>
        {nearLimit && (
          <span className="font-sans text-[12px] text-[var(--color-gray)]">
            {content.length}/{MAX_COMMENT_LENGTH}
          </span>
        )}
      </div>
    </form>
  );
}
