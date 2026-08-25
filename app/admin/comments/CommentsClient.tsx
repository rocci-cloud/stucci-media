"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, MessageSquare, Pin, Search, Trash2 } from "lucide-react";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { deleteCommentAction, setCommentApprovedAction, setCommentPinnedAction } from "./actions";
import type { AdminComment } from "../../lib/comments";

type StatusFilter = "all" | "approved" | "hidden";
type OptimisticAction =
  | { type: "approve"; id: string; isApproved: boolean }
  | { type: "pin"; id: string; isPinned: boolean }
  | { type: "delete"; id: string };

function reducer(state: AdminComment[], action: OptimisticAction): AdminComment[] {
  switch (action.type) {
    case "approve":
      return state.map((c) => (c.id === action.id ? { ...c, isApproved: action.isApproved } : c));
    case "pin":
      return state.map((c) => (c.id === action.id ? { ...c, isPinned: action.isPinned } : c));
    case "delete":
      return state.filter((c) => c.id !== action.id);
  }
}

export default function CommentsClient({ initialComments }: { initialComments: AdminComment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [optimisticComments, applyOptimistic] = useOptimistic(comments, reducer);
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminComment | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return optimisticComments.filter((c) => {
      if (status === "approved" && !c.isApproved) return false;
      if (status === "hidden" && c.isApproved) return false;
      if (!q) return true;
      return (
        c.content.toLowerCase().includes(q) ||
        c.authorName.toLowerCase().includes(q) ||
        c.authorEmail.toLowerCase().includes(q) ||
        c.targetTitle.toLowerCase().includes(q)
      );
    });
  }, [optimisticComments, query, status]);

  function handleToggleApproved(comment: AdminComment) {
    const next = !comment.isApproved;
    setPendingId(comment.id);
    startTransition(async () => {
      applyOptimistic({ type: "approve", id: comment.id, isApproved: next });
      const result = await setCommentApprovedAction(comment.id, next);
      setPendingId(null);
      if (result.success) {
        setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, isApproved: next } : c)));
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleTogglePinned(comment: AdminComment) {
    const next = !comment.isPinned;
    setPendingId(comment.id);
    startTransition(async () => {
      applyOptimistic({ type: "pin", id: comment.id, isPinned: next });
      const result = await setCommentPinnedAction(comment.id, next);
      setPendingId(null);
      if (result.success) {
        setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, isPinned: next } : c)));
        toast.success(next ? "Pinned as Editor's Pick." : "Unpinned.");
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setPendingId(target.id);
    startTransition(async () => {
      applyOptimistic({ type: "delete", id: target.id });
      const result = await deleteCommentAction(target.id);
      setPendingId(null);
      if (result.success) {
        setComments((prev) => prev.filter((c) => c.id !== target.id));
        toast.success("Comment deleted.");
      } else {
        toast.error(result.error);
      }
    });
  }

  const hasComments = optimisticComments.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-fg-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search comments…"
            className="pl-8"
            aria-label="Search comments"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "approved", "hidden"] as StatusFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`min-h-8 rounded-md px-2.5 text-[13px] font-medium capitalize transition-colors ${
                status === key
                  ? "bg-[var(--admin-fg)] text-white"
                  : "text-[var(--admin-fg-muted)] hover:bg-[var(--admin-bg-subtle)]"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {!hasComments ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
            <MessageSquare className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-[var(--admin-fg)]">No comments yet</p>
          <p className="text-[13px] text-[var(--admin-fg-muted)]">
            They&apos;ll show up here as readers comment on articles.
          </p>
        </div>
      ) : !hasResults ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
          <Search className="h-6 w-6 text-[var(--admin-fg-muted)]" />
          <p className="text-sm font-semibold text-[var(--admin-fg)]">No matches</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comment</TableHead>
                <TableHead className="hidden sm:table-cell">Author</TableHead>
                <TableHead className="hidden md:table-cell">On</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="w-20 text-center">Visible</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((comment) => (
                <TableRow key={comment.id} className={pendingId === comment.id ? "opacity-50" : ""}>
                  <TableCell className="max-w-[320px]">
                    <p className="line-clamp-2 text-[13.5px]">{comment.content}</p>
                    <div className="mt-1 flex gap-1.5">
                      {comment.isPinned && <Badge>Editor&rsquo;s Pick</Badge>}
                      {!comment.isApproved && <Badge variant="outline">Hidden</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="text-[13px] font-medium">{comment.authorName}</div>
                    <div className="text-[12px] text-[var(--admin-fg-muted)]">{comment.authorEmail}</div>
                  </TableCell>
                  <TableCell className="hidden max-w-[220px] truncate md:table-cell">
                    <Link
                      href={comment.targetHref}
                      target="_blank"
                      className="text-[13px] text-[var(--admin-primary)] hover:underline"
                    >
                      {comment.targetTitle}
                    </Link>
                    {/* Which surface this came from. Without it an episode
                        comment and an article comment are indistinguishable
                        in the queue. */}
                    <div className="text-[11px] uppercase tracking-wide text-[var(--admin-fg-muted)]">
                      {comment.targetKind === "episode" ? "Episode" : "Article"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-[var(--admin-fg-muted)] lg:table-cell">
                    {new Date(comment.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    {pendingId === comment.id ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin text-[var(--admin-fg-muted)]" />
                    ) : (
                      <Switch
                        checked={comment.isApproved}
                        onCheckedChange={() => handleToggleApproved(comment)}
                        aria-label={`Toggle visibility for comment by ${comment.authorName}`}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={comment.isPinned ? "Unpin as Editor's Pick" : "Pin as Editor's Pick"}
                        aria-pressed={comment.isPinned}
                        onClick={() => handleTogglePinned(comment)}
                        className={comment.isPinned ? "text-[var(--admin-primary)]" : ""}
                      >
                        <Pin className="h-4 w-4" fill={comment.isPinned ? "currentColor" : "none"} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete comment"
                        onClick={() => setDeleteTarget(comment)}
                        className="text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-[var(--admin-danger)] text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
