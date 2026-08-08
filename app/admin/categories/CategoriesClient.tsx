"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { FolderTree, Loader2, MoreHorizontal, Plus, Search, Trash2, Pencil } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
import CategoryDialog from "./CategoryDialog";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "./actions";
import type { Category, CategoryWithCount } from "../../lib/categories";

type SortKey = "name" | "articles" | "newest";

type OptimisticAction = { type: "delete"; id: string };

function reducer(state: CategoryWithCount[], action: OptimisticAction): CategoryWithCount[] {
  switch (action.type) {
    case "delete":
      return state.filter((c) => c.id !== action.id);
  }
}

export default function CategoriesClient({ initialCategories }: { initialCategories: CategoryWithCount[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [optimisticCategories, applyOptimistic] = useOptimistic(categories, reducer);
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = optimisticCategories;
    if (q) {
      list = list.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortKey === "articles") return b.articleCount - a.articleCount;
      if (sortKey === "newest") return b.createdAt.localeCompare(a.createdAt);
      return a.label.localeCompare(b.label);
    });
  }, [optimisticCategories, query, sortKey]);

  function openCreateDialog() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  function handleCreateSuccess(category: Category) {
    setCategories((prev) => [...prev, { ...category, articleCount: 0 }]);
    toast.success(`"${category.label}" created.`);
  }

  function handleUpdateSuccess(category: Category) {
    setCategories((prev) => prev.map((c) => (c.id === category.id ? { ...c, ...category } : c)));
    toast.success(`"${category.label}" saved.`);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(target.id);

    startTransition(async () => {
      applyOptimistic({ type: "delete", id: target.id });
      const result = await deleteCategoryAction(target.id, target.slug);
      setDeletingId(null);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== target.id));
        toast.success(`"${target.label}" deleted.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  const hasCategories = optimisticCategories.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-fg-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories…"
            className="pl-8"
            aria-label="Search categories"
          />
        </div>

        <div className="flex items-center gap-2">
          <SortMenu sortKey={sortKey} onChange={setSortKey} />
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="h-4 w-4" />
            New category
          </Button>
        </div>
      </div>

      {!hasCategories ? (
        <EmptyState
          icon={<FolderTree className="h-6 w-6" />}
          title="No categories yet"
          description="Create your first category to start organizing articles."
          action={
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4" />
              New category
            </Button>
          }
        />
      ) : !hasResults ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No matches"
          description={`Nothing matches "${query}".`}
          action={
            <Button variant="outline" size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead className="hidden sm:table-cell">Nav</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((category) => (
                <TableRow key={category.id} className={deletingId === category.id ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{category.label}</TableCell>
                  <TableCell className="hidden font-mono text-[12px] text-[var(--admin-fg-muted)] sm:table-cell">
                    {category.slug}
                  </TableCell>
                  <TableCell className="hidden max-w-[280px] truncate text-[var(--admin-fg-muted)] md:table-cell">
                    {category.description || <span className="italic">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.articleCount > 0 ? "default" : "outline"}>
                      {category.articleCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {category.navPlacement === "MAIN" && (
                      <Badge variant="success">Main #{category.navOrder}</Badge>
                    )}
                    {category.navPlacement === "MORE" && (
                      <Badge variant="default">More #{category.navOrder}</Badge>
                    )}
                    {category.navPlacement === "HIDDEN" && <Badge variant="outline">Hidden</Badge>}
                  </TableCell>
                  <TableCell>
                    {deletingId === category.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--admin-fg-muted)]" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${category.label}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEditDialog(category)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleteTarget(category)}
                          >
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

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        currentMainNavCount={optimisticCategories.filter((c) => c.navPlacement === "MAIN").length}
        onSubmit={(formData) =>
          editingCategory ? updateCategoryAction(editingCategory.id, formData) : createCategoryAction(formData)
        }
        onSuccess={editingCategory ? handleUpdateSuccess : handleCreateSuccess}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.label}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.articleCount > 0
                ? `This category has ${deleteTarget.articleCount} article${deleteTarget.articleCount === 1 ? "" : "s"} filed under it. Re-file them before deleting.`
                : "This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending || Boolean(deleteTarget && deleteTarget.articleCount > 0)}
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

function SortMenu({ sortKey, onChange }: { sortKey: SortKey; onChange: (key: SortKey) => void }) {
  const labels: Record<SortKey, string> = { name: "Name (A–Z)", articles: "Most articles", newest: "Newest" };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Sort: {labels[sortKey]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(labels) as SortKey[]).map((key) => (
          <DropdownMenuItem key={key} onSelect={() => onChange(key)}>
            {labels[key]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[var(--admin-fg)]">{title}</p>
        <p className="text-[13px] text-[var(--admin-fg-muted)]">{description}</p>
      </div>
      {action}
    </div>
  );
}
