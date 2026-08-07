"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Newspaper, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
import { deleteArticleFromListAction } from "./actions";
import type { Article } from "../../lib/articles";

type StatusFilter = "all" | "published" | "draft";

export default function ArticlesClient({ initialArticles }: { initialArticles: Article[] }) {
  const [articles, setArticles] = useState(initialArticles);
  const [optimisticArticles, applyDelete] = useOptimistic(
    articles,
    (state: Article[], id: number) => state.filter((a) => a.id !== id)
  );
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return optimisticArticles.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (!q) return true;
      return a.headline.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    });
  }, [optimisticArticles, query, status]);

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(target.id);

    startTransition(async () => {
      applyDelete(target.id);
      const result = await deleteArticleFromListAction(target.id);
      setDeletingId(null);
      if (result.success) {
        setArticles((prev) => prev.filter((a) => a.id !== target.id));
        toast.success(`"${target.headline}" deleted.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  const hasArticles = optimisticArticles.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-fg-muted)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles…"
              className="pl-8"
              aria-label="Search articles"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "published", "draft"] as StatusFilter[]).map((key) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                className={`min-h-8 rounded-md px-3 text-[13px] font-medium capitalize transition-colors ${
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

        <Button asChild size="sm">
          <Link href="/admin/articles/new">
            <Plus className="h-4 w-4" />
            New article
          </Link>
        </Button>
      </div>

      {!hasArticles ? (
        <EmptyState
          title="No articles yet"
          description="Write your first story to get the site rolling."
          href="/admin/articles/new"
          cta="New article"
        />
      ) : !hasResults ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
            <Search className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-[var(--admin-fg)]">No matches</p>
          <Button variant="outline" size="sm" onClick={() => { setQuery(""); setStatus("all"); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Headline</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((article) => (
                <TableRow key={article.id} className={deletingId === article.id ? "opacity-50" : ""}>
                  <TableCell className="max-w-[320px] truncate font-medium">
                    <Link href={`/admin/articles/${article.id}/edit`} className="hover:underline">
                      {article.headline}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-[var(--admin-fg-muted)] sm:table-cell">
                    {article.category}
                  </TableCell>
                  <TableCell>
                    <Badge variant={article.status === "published" ? "success" : "outline"}>
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-[var(--admin-fg-muted)] md:table-cell">{article.date}</TableCell>
                  <TableCell>
                    {deletingId === article.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--admin-fg-muted)]" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${article.headline}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/articles/${article.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(article)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.headline}&rdquo;?</AlertDialogTitle>
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

function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
        <Newspaper className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[var(--admin-fg)]">{title}</p>
        <p className="text-[13px] text-[var(--admin-fg-muted)]">{description}</p>
      </div>
      <Button asChild size="sm">
        <Link href={href}>
          <Plus className="h-4 w-4" />
          {cta}
        </Link>
      </Button>
    </div>
  );
}
