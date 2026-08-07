"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Newspaper, Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
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
import CategoryQuickEdit from "./CategoryQuickEdit";
import BulkCategoryPicker from "./BulkCategoryPicker";
import {
  bulkDeleteAction,
  bulkSetStatusAction,
  bulkSetFeaturedAction,
  bulkSetCategoriesAction,
  deleteArticleFromListAction,
  toggleFeaturedAction,
  updateArticleCategoriesAction,
} from "./actions";
import { computeSeoScore } from "../../lib/seo-score";
import type { Article } from "../../lib/articles";
import type { Category } from "../../lib/categories";

type StatusFilter = "all" | "published" | "draft";
type FeaturedFilter = "all" | "featured" | "not-featured";

type OptimisticAction =
  | { type: "delete"; id: number }
  | { type: "bulkDelete"; ids: number[] }
  | { type: "featured"; id: number; value: boolean }
  | { type: "categories"; id: number; slugs: string[]; categories: Category[] }
  | { type: "bulkCategories"; ids: number[]; slugs: string[]; categories: Category[] }
  | { type: "bulkFeatured"; ids: number[]; value: boolean }
  | { type: "status"; ids: number[]; status: "draft" | "published" };

function reducer(state: Article[], action: OptimisticAction): Article[] {
  switch (action.type) {
    case "delete":
      return state.filter((a) => a.id !== action.id);
    case "bulkDelete":
      return state.filter((a) => !action.ids.includes(a.id));
    case "featured":
      return state.map((a) => (a.id === action.id ? { ...a, isFeatured: action.value } : a));
    case "categories":
      return state.map((a) =>
        a.id === action.id
          ? {
              ...a,
              categorySlugs: action.slugs,
              categories: action.slugs.map(
                (s) => action.categories.find((c) => c.slug === s)?.label ?? s
              ),
              categorySlug: action.slugs[0] ?? a.categorySlug,
              category: action.categories.find((c) => c.slug === action.slugs[0])?.label ?? a.category,
            }
          : a
      );
    case "bulkCategories":
      return state.map((a) =>
        action.ids.includes(a.id)
          ? {
              ...a,
              categorySlugs: action.slugs,
              categories: action.slugs.map(
                (s) => action.categories.find((c) => c.slug === s)?.label ?? s
              ),
              categorySlug: action.slugs[0] ?? a.categorySlug,
              category: action.categories.find((c) => c.slug === action.slugs[0])?.label ?? a.category,
            }
          : a
      );
    case "bulkFeatured":
      return state.map((a) => (action.ids.includes(a.id) ? { ...a, isFeatured: action.value } : a));
    case "status":
      return state.map((a) => (action.ids.includes(a.id) ? { ...a, status: action.status } : a));
  }
}

function seoScoreFor(article: Article) {
  return computeSeoScore({
    headline: article.headline,
    seoTitle: article.seoTitle,
    dek: article.dek,
    seoDescription: article.seoDescription,
    seoKeywords: article.seoKeywords,
    slug: article.slug,
    coverImageUrl: article.coverImageUrl,
    bodyHtml: article.bodyHtml,
  }).score;
}

function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 80 ? "success" : score >= 50 ? "default" : "danger";
  return <Badge variant={variant}>{score}</Badge>;
}

export default function ArticlesClient({
  initialArticles,
  categories,
}: {
  initialArticles: Article[];
  categories: Category[];
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [optimisticArticles, applyOptimistic] = useOptimistic(articles, reducer);
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [featured, setFeatured] = useState<FeaturedFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [rowPendingId, setRowPendingId] = useState<number | null>(null);
  const [categoryPendingId, setCategoryPendingId] = useState<number | null>(null);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return optimisticArticles.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (featured === "featured" && !a.isFeatured) return false;
      if (featured === "not-featured" && a.isFeatured) return false;
      if (categoryFilter !== "all" && !a.categorySlugs.includes(categoryFilter)) return false;
      if (!q) return true;
      return a.headline.toLowerCase().includes(q) || a.categories.some((c) => c.toLowerCase().includes(q));
    });
  }, [optimisticArticles, query, status, featured, categoryFilter]);

  const visibleIds = filtered.map((a) => a.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  function toggleSelectAll() {
    setSelected((prev) => {
      if (allVisibleSelected) return new Set([...prev].filter((id) => !visibleIds.includes(id)));
      return new Set([...prev, ...visibleIds]);
    });
  }

  function toggleSelectOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleFeatured(article: Article) {
    const next = !article.isFeatured;
    setRowPendingId(article.id);
    startTransition(async () => {
      applyOptimistic({ type: "featured", id: article.id, value: next });
      const result = await toggleFeaturedAction(article.id, next);
      setRowPendingId(null);
      if (result.success) {
        setArticles((prev) => prev.map((a) => (a.id === article.id ? { ...a, isFeatured: next } : a)));
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleCategoriesChange(article: Article, slugs: string[]) {
    setCategoryPendingId(article.id);
    startTransition(async () => {
      applyOptimistic({ type: "categories", id: article.id, slugs, categories });
      const result = await updateArticleCategoriesAction(article.id, slugs);
      setCategoryPendingId(null);
      if (result.success) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === article.id
              ? {
                  ...a,
                  categorySlugs: slugs,
                  categories: slugs.map((s) => categories.find((c) => c.slug === s)?.label ?? s),
                  categorySlug: slugs[0] ?? a.categorySlug,
                  category: categories.find((c) => c.slug === slugs[0])?.label ?? a.category,
                }
              : a
          )
        );
        toast.success("Categories updated.");
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setRowPendingId(target.id);

    startTransition(async () => {
      applyOptimistic({ type: "delete", id: target.id });
      const result = await deleteArticleFromListAction(target.id);
      setRowPendingId(null);
      if (result.success) {
        setArticles((prev) => prev.filter((a) => a.id !== target.id));
        toast.success(`"${target.headline}" deleted.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleBulkStatus(newStatus: "draft" | "published") {
    const ids = [...selected];
    startTransition(async () => {
      applyOptimistic({ type: "status", ids, status: newStatus });
      const result = await bulkSetStatusAction(ids, newStatus);
      if (result.success) {
        setArticles((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, status: newStatus } : a)));
        toast.success(`${ids.length} article${ids.length === 1 ? "" : "s"} marked ${newStatus}.`);
        setSelected(new Set());
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleBulkFeatured(value: boolean) {
    const ids = [...selected];
    startTransition(async () => {
      applyOptimistic({ type: "bulkFeatured", ids, value });
      const result = await bulkSetFeaturedAction(ids, value);
      if (result.success) {
        setArticles((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, isFeatured: value } : a)));
        toast.success(`${ids.length} article${ids.length === 1 ? "" : "s"} ${value ? "featured" : "unfeatured"}.`);
        setSelected(new Set());
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleBulkCategories(slugs: string[]) {
    const ids = [...selected];
    startTransition(async () => {
      applyOptimistic({ type: "bulkCategories", ids, slugs, categories });
      const result = await bulkSetCategoriesAction(ids, slugs);
      if (result.success) {
        setArticles((prev) =>
          prev.map((a) =>
            ids.includes(a.id)
              ? {
                  ...a,
                  categorySlugs: slugs,
                  categories: slugs.map((s) => categories.find((c) => c.slug === s)?.label ?? s),
                  categorySlug: slugs[0] ?? a.categorySlug,
                  category: categories.find((c) => c.slug === slugs[0])?.label ?? a.category,
                }
              : a
          )
        );
        toast.success(`${ids.length} article${ids.length === 1 ? "" : "s"} recategorized.`);
        setSelected(new Set());
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmBulkDelete() {
    const ids = [...selected];
    setBulkDeleteOpen(false);
    startTransition(async () => {
      applyOptimistic({ type: "bulkDelete", ids });
      const result = await bulkDeleteAction(ids);
      if (result.success) {
        setArticles((prev) => prev.filter((a) => !ids.includes(a.id)));
        toast.success(`${ids.length} article${ids.length === 1 ? "" : "s"} deleted.`);
        setSelected(new Set());
      } else {
        toast.error(result.error);
      }
    });
  }

  const hasArticles = optimisticArticles.length > 0;
  const hasResults = filtered.length > 0;
  const selectedCount = selected.size;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-fg-muted)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles…"
              className="pl-8"
              aria-label="Search articles"
            />
          </div>
          <FilterPills
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
          />
          <FilterPills
            value={featured}
            onChange={setFeatured}
            options={[
              { value: "all", label: "All" },
              { value: "featured", label: "Featured" },
              { value: "not-featured", label: "Not featured" },
            ]}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-md border border-[var(--admin-border)] bg-white px-2 text-[13px] text-[var(--admin-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ring)]"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <Button asChild size="sm">
          <Link href="/admin/articles/new">
            <Plus className="h-4 w-4" />
            New article
          </Link>
        </Button>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg-subtle)] px-4 py-2.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="shrink-0 text-[13px] font-medium text-[var(--admin-fg)]">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-2 overflow-x-auto sm:ml-auto [&>*]:shrink-0">
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus("published")} disabled={isPending}>
              Publish
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus("draft")} disabled={isPending}>
              Unpublish
            </Button>
            <BulkCategoryPicker categories={categories} disabled={isPending} onApply={handleBulkCategories} />
            <Button size="sm" variant="outline" onClick={() => handleBulkFeatured(true)} disabled={isPending}>
              <Sparkles className="h-4 w-4" />
              Feature
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkFeatured(false)} disabled={isPending}>
              Unfeature
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={isPending}
              className="text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg)]"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} aria-label="Clear selection">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setFeatured("all");
              setCategoryFilter("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4 rounded border-[var(--admin-border)] accent-[var(--admin-primary)]"
                  />
                </TableHead>
                <TableHead className="w-14 text-center">Featured</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden lg:table-cell">Categories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">SEO</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((article) => {
                const rowBusy = rowPendingId === article.id;
                return (
                  <TableRow key={article.id} className={rowBusy ? "opacity-50" : ""}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(article.id)}
                        onChange={() => toggleSelectOne(article.id)}
                        aria-label={`Select ${article.headline}`}
                        className="h-4 w-4 rounded border-[var(--admin-border)] accent-[var(--admin-primary)]"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        {rowBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[var(--admin-fg-muted)]" />
                        ) : (
                          <Switch
                            checked={article.isFeatured}
                            onCheckedChange={() => handleToggleFeatured(article)}
                            aria-label={`Toggle featured for ${article.headline}`}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[140px] sm:max-w-[280px]">
                      <Link href={`/admin/articles/${article.id}/edit`} className="flex items-center gap-1.5 truncate font-medium hover:underline">
                        {article.isFeatured && <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--admin-primary)]" />}
                        <span className="truncate">{article.headline}</span>
                      </Link>
                      <span className="mt-0.5 block text-[11px] text-[var(--admin-fg-muted)] sm:hidden">
                        {article.date}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <CategoryQuickEdit
                        categories={categories}
                        selectedSlugs={article.categorySlugs}
                        pending={categoryPendingId === article.id}
                        onApply={(slugs) => handleCategoriesChange(article, slugs)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={article.status === "published" ? "success" : "outline"}>
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-[var(--admin-fg-muted)] md:table-cell">{article.date}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <ScoreBadge score={seoScoreFor(article)} />
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                );
              })}
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} article{selectedCount === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
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

function FilterPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`min-h-8 rounded-md px-2.5 text-[13px] font-medium transition-colors ${
            value === opt.value
              ? "bg-[var(--admin-fg)] text-white"
              : "text-[var(--admin-fg-muted)] hover:bg-[var(--admin-bg-subtle)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
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
