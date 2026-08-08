"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import BannerDialog from "./BannerDialog";
import { createBannerAction, deleteBannerAction, toggleBannerActiveAction, updateBannerAction } from "./actions";
import { BANNER_PLACEMENT_LABELS, type BannerPlacement } from "../../lib/banner-placements";
import type { Banner } from "../../lib/banners";

type PlacementFilter = "all" | BannerPlacement;

type OptimisticAction = { type: "delete"; id: string } | { type: "active"; id: string; value: boolean };

function reducer(state: Banner[], action: OptimisticAction): Banner[] {
  switch (action.type) {
    case "delete":
      return state.filter((b) => b.id !== action.id);
    case "active":
      return state.map((b) => (b.id === action.id ? { ...b, isActive: action.value } : b));
  }
}

function formatWindow(banner: Banner): string {
  if (!banner.startDate && !banner.endDate) return "Always";
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (banner.startDate && banner.endDate) return `${fmt(banner.startDate)} – ${fmt(banner.endDate)}`;
  if (banner.startDate) return `From ${fmt(banner.startDate)}`;
  return `Until ${fmt(banner.endDate!)}`;
}

export default function BannersClient({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [optimisticBanners, applyOptimistic] = useOptimistic(banners, reducer);
  const [isPending, startTransition] = useTransition();

  const [placementFilter, setPlacementFilter] = useState<PlacementFilter>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (placementFilter === "all") return optimisticBanners;
    return optimisticBanners.filter((b) => b.placement === placementFilter);
  }, [optimisticBanners, placementFilter]);

  function openCreateDialog() {
    setEditingBanner(null);
    setDialogOpen(true);
  }

  function openEditDialog(banner: Banner) {
    setEditingBanner(banner);
    setDialogOpen(true);
  }

  function handleCreateSuccess(banner: Banner) {
    setBanners((prev) => [banner, ...prev]);
    toast.success(`Banner ${banner.name ? `"${banner.name}"` : ""} created.`);
  }

  function handleUpdateSuccess(banner: Banner) {
    setBanners((prev) => prev.map((b) => (b.id === banner.id ? banner : b)));
    toast.success(`Banner ${banner.name ? `"${banner.name}"` : ""} saved.`);
  }

  function handleToggleActive(banner: Banner) {
    const next = !banner.isActive;
    setTogglingId(banner.id);
    startTransition(async () => {
      applyOptimistic({ type: "active", id: banner.id, value: next });
      const result = await toggleBannerActiveAction(banner.id, next);
      setTogglingId(null);
      if (result.success) {
        setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, isActive: next } : b)));
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
      const result = await deleteBannerAction(target.id, target.name || target.destinationUrl);
      setDeletingId(null);
      if (result.success) {
        setBanners((prev) => prev.filter((b) => b.id !== target.id));
        toast.success("Banner deleted.");
      } else {
        toast.error(result.error);
      }
    });
  }

  const hasBanners = optimisticBanners.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={placementFilter} onValueChange={(v) => setPlacementFilter(v as PlacementFilter)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All placements</SelectItem>
            {(Object.keys(BANNER_PLACEMENT_LABELS) as BannerPlacement[]).map((p) => (
              <SelectItem key={p} value={p}>
                {BANNER_PLACEMENT_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4" />
          New banner
        </Button>
      </div>

      {!hasBanners ? (
        <EmptyState
          title="No banners yet"
          description="Add a banner to start showing it on the site — it only appears once it's marked Active."
          action={
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4" />
              New banner
            </Button>
          }
        />
      ) : !hasResults ? (
        <EmptyState
          title="No banners in this placement"
          description="Nothing is filed under this placement yet."
          action={
            <Button variant="outline" size="sm" onClick={() => setPlacementFilter("all")}>
              Show all placements
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Placement</TableHead>
                <TableHead className="hidden lg:table-cell">Window</TableHead>
                <TableHead className="hidden sm:table-cell">Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((banner) => (
                <TableRow key={banner.id} className={deletingId === banner.id ? "opacity-50" : ""}>
                  <TableCell>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.imageUrl}
                      alt=""
                      className="h-10 w-16 rounded-md border border-[var(--admin-border)] object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{banner.name || <span className="italic text-[var(--admin-fg-muted)]">Untitled</span>}</span>
                      <span className="max-w-[220px] truncate text-[12px] text-[var(--admin-fg-muted)]">
                        {banner.destinationUrl}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{BANNER_PLACEMENT_LABELS[banner.placement]}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-[13px] text-[var(--admin-fg-muted)]">
                    {formatWindow(banner)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-[13px] text-[var(--admin-fg-muted)]">
                    {banner.sortOrder}
                  </TableCell>
                  <TableCell>
                    {togglingId === banner.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--admin-fg-muted)]" />
                    ) : (
                      <Switch
                        checked={banner.isActive}
                        onCheckedChange={() => handleToggleActive(banner)}
                        aria-label={`Toggle ${banner.name || "banner"} active`}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {deletingId === banner.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--admin-fg-muted)]" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${banner.name || "banner"}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEditDialog(banner)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(banner)}>
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

      <BannerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        banner={editingBanner}
        defaultPlacement={placementFilter !== "all" ? placementFilter : undefined}
        onSubmit={(formData) =>
          editingBanner ? updateBannerAction(editingBanner.id, formData) : createBannerAction(formData)
        }
        onSuccess={editingBanner ? handleUpdateSuccess : handleCreateSuccess}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this banner?</AlertDialogTitle>
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
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
        <ImagePlus className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[var(--admin-fg)]">{title}</p>
        <p className="text-[13px] text-[var(--admin-fg-muted)]">{description}</p>
      </div>
      {action}
    </div>
  );
}
