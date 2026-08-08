"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Link2, Loader2, MoreHorizontal, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "../components/ui/button";
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
import RedirectDialog from "./RedirectDialog";
import { createRedirectAction, deleteRedirectAction, updateRedirectAction } from "./actions";
import type { Redirect } from "../../lib/redirects";

type OptimisticAction = { type: "delete"; id: string } | { type: "active"; id: string; value: boolean };

function reducer(state: Redirect[], action: OptimisticAction): Redirect[] {
  switch (action.type) {
    case "delete":
      return state.filter((r) => r.id !== action.id);
    case "active":
      return state.map((r) => (r.id === action.id ? { ...r, isActive: action.value } : r));
  }
}

export default function RedirectsClient({ initialRedirects }: { initialRedirects: Redirect[] }) {
  const [redirects, setRedirects] = useState(initialRedirects);
  const [optimisticRedirects, applyOptimistic] = useOptimistic(redirects, reducer);
  const [, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Redirect | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function openCreateDialog() {
    setEditingRedirect(null);
    setDialogOpen(true);
  }

  function openEditDialog(redirect: Redirect) {
    setEditingRedirect(redirect);
    setDialogOpen(true);
  }

  function handleCreateSuccess(redirect: Redirect) {
    setRedirects((prev) => [redirect, ...prev]);
    toast.success("Redirect created.");
  }

  function handleUpdateSuccess(redirect: Redirect) {
    setRedirects((prev) => prev.map((r) => (r.id === redirect.id ? redirect : r)));
    toast.success("Redirect saved.");
  }

  function handleToggleActive(redirect: Redirect) {
    const next = !redirect.isActive;
    setTogglingId(redirect.id);
    startTransition(async () => {
      applyOptimistic({ type: "active", id: redirect.id, value: next });
      const formData = new FormData();
      formData.set("fromPath", redirect.fromPath);
      formData.set("toPath", redirect.toPath);
      formData.set("statusCode", String(redirect.statusCode));
      formData.set("isActive", String(next));
      const result = await updateRedirectAction(redirect.id, formData);
      setTogglingId(null);
      if (result.success) {
        setRedirects((prev) => prev.map((r) => (r.id === redirect.id ? result.redirect : r)));
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(target.id);

    startTransition(async () => {
      applyOptimistic({ type: "delete", id: target.id });
      const result = await deleteRedirectAction(target.id, `${target.fromPath} → ${target.toPath}`);
      setDeletingId(null);
      if (result.success) {
        setRedirects((prev) => prev.filter((r) => r.id !== target.id));
        toast.success("Redirect deleted.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--admin-fg-muted)]">
          Visiting an old path sends the visitor straight to the new one — no 404, no lost traffic or links.
        </p>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4" />
          New redirect
        </Button>
      </div>

      {optimisticRedirects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
            <Link2 className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-[var(--admin-fg)]">No redirects yet</p>
            <p className="text-[13px] text-[var(--admin-fg-muted)]">
              Add one when a URL changes or an old page retires.
            </p>
          </div>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="h-4 w-4" />
            New redirect
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Redirect</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimisticRedirects.map((redirect) => (
                <TableRow key={redirect.id} className={deletingId === redirect.id ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-[12.5px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[var(--admin-fg)]">{redirect.fromPath}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--admin-fg-muted)]" />
                      <span className="text-[var(--admin-fg-muted)]">{redirect.toPath}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{redirect.statusCode}</Badge>
                  </TableCell>
                  <TableCell>
                    {togglingId === redirect.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--admin-fg-muted)]" />
                    ) : (
                      <Switch
                        checked={redirect.isActive}
                        onCheckedChange={() => handleToggleActive(redirect)}
                        aria-label={`Toggle redirect from ${redirect.fromPath} active`}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {deletingId === redirect.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--admin-fg-muted)]" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEditDialog(redirect)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(redirect)}>
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

      <RedirectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        redirect={editingRedirect}
        onSubmit={(formData) =>
          editingRedirect ? updateRedirectAction(editingRedirect.id, formData) : createRedirectAction(formData)
        }
        onSuccess={editingRedirect ? handleUpdateSuccess : handleCreateSuccess}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this redirect?</AlertDialogTitle>
            <AlertDialogDescription>
              Visitors to &ldquo;{deleteTarget?.fromPath}&rdquo; will see a normal 404 again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
