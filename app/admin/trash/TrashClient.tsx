"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
import { emptyTrashAction, purgeArticleAction, restoreArticleAction } from "../articles/actions";
import { ARTICLE_STATUS_LABELS, type Article } from "../../lib/articles";

type Action = { type: "remove"; ids: number[] };

function reducer(state: Article[], action: Action): Article[] {
  return state.filter((a) => !action.ids.includes(a.id));
}

function deletedWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default function TrashClient({ articles: initial, canRestore }: { articles: Article[]; canRestore: boolean }) {
  const [articles, setArticles] = useState(initial);
  const [optimistic, apply] = useOptimistic(articles, reducer);
  const [, startTransition] = useTransition();
  const [purgeTarget, setPurgeTarget] = useState<Article | null>(null);
  const [emptyOpen, setEmptyOpen] = useState(false);

  function restore(article: Article) {
    startTransition(async () => {
      apply({ type: "remove", ids: [article.id] });
      const result = await restoreArticleAction(article.id);
      if (result.success) {
        setArticles((prev) => prev.filter((a) => a.id !== article.id));
        toast.success(`"${article.headline}" restored as ${ARTICLE_STATUS_LABELS[article.status]}.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function purge(article: Article) {
    setPurgeTarget(null);
    startTransition(async () => {
      apply({ type: "remove", ids: [article.id] });
      const result = await purgeArticleAction(article.id);
      if (result.success) {
        setArticles((prev) => prev.filter((a) => a.id !== article.id));
        toast.success("Deleted for good.");
      } else {
        toast.error(result.error);
      }
    });
  }

  function empty() {
    setEmptyOpen(false);
    const ids = articles.map((a) => a.id);
    startTransition(async () => {
      apply({ type: "remove", ids });
      const result = await emptyTrashAction();
      if (result.success) {
        setArticles([]);
        toast.success("Trash emptied.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--admin-fg)]">Trash</h1>
          <p className="text-[13px] text-[var(--admin-fg-muted)]">
            Deleted articles stay here until you empty the trash. Restoring puts a story back exactly as it was.
          </p>
        </div>
        {canRestore && optimistic.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEmptyOpen(true)}
            className="text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg)]"
          >
            <Trash2 className="h-4 w-4" />
            Empty trash
          </Button>
        )}
      </div>

      {!canRestore && (
        <p className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg-subtle)] px-3.5 py-2.5 text-[13px] text-[var(--admin-fg-muted)]">
          Restoring and permanently deleting are editor-level actions. Ask an editor to bring something back.
        </p>
      )}

      {optimistic.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
            <Trash2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-[var(--admin-fg)]">Trash is empty</p>
          <p className="max-w-sm text-[13px] text-[var(--admin-fg-muted)]">
            Nothing has been deleted. Anything you remove from Articles lands here first.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Was</TableHead>
                <TableHead className="hidden md:table-cell">Deleted</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimistic.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="max-w-[200px] font-medium sm:max-w-[360px]">
                    <span className="block truncate">{article.headline}</span>
                    <span className="block truncate text-[11.5px] text-[var(--admin-fg-muted)]">
                      {article.author} · {article.category}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{ARTICLE_STATUS_LABELS[article.status]}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-[13px] text-[var(--admin-fg-muted)] md:table-cell">
                    {deletedWhen(article.deletedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {canRestore ? (
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => restore(article)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Permanently delete ${article.headline}`}
                          onClick={() => setPurgeTarget(article)}
                          className="text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[12.5px] text-[var(--admin-fg-muted)]">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={purgeTarget !== null} onOpenChange={(open) => !open && setPurgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete &ldquo;{purgeTarget?.headline}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This also removes its comments, likes, saves, and revision history. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => purgeTarget && purge(purgeTarget)}
              className="bg-[var(--admin-danger)] text-white hover:bg-red-700"
            >
              Delete for good
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={emptyOpen} onOpenChange={setEmptyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Empty the trash ({optimistic.length} article{optimistic.length === 1 ? "" : "s"})?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Every article here is deleted for good, along with its comments, likes, saves, and revision history.
              There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={empty}
              className="bg-[var(--admin-danger)] text-white hover:bg-red-700"
            >
              Empty trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
