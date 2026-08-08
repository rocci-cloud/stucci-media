"use client";

import { useOptimistic, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Copy, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "../components/ui/button";
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
import { compressImageIfNeeded } from "../articles/image-compression";
import { deleteMediaAssetAction, recordMediaAssetAction } from "./actions";
import type { MediaAsset } from "../../lib/media";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type OptimisticAction = { type: "add"; asset: MediaAsset } | { type: "delete"; id: string };

function reducer(state: MediaAsset[], action: OptimisticAction): MediaAsset[] {
  switch (action.type) {
    case "add":
      return [action.asset, ...state];
    case "delete":
      return state.filter((a) => a.id !== action.id);
  }
}

export default function MediaClient({ initialAssets }: { initialAssets: MediaAsset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [optimisticAssets, applyOptimistic] = useOptimistic(assets, reducer);
  const [, startTransition] = useTransition();

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    setUploading(true);
    try {
      const optimized = await compressImageIfNeeded(file);
      if (optimized.size > MAX_UPLOAD_BYTES) {
        toast.error("That image is too large even after compression — try a smaller file (max 10MB).");
        return;
      }
      const blob = await upload(optimized.name, optimized, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      const result = await recordMediaAssetAction(blob.url, optimized.name);
      if (result.success) {
        setAssets((prev) => [result.asset, ...prev]);
        toast.success("Uploaded to the media library.");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Image URL copied.");
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(target.id);

    startTransition(async () => {
      applyOptimistic({ type: "delete", id: target.id });
      const result = await deleteMediaAssetAction(target.id);
      setDeletingId(null);
      if (result.success) {
        setAssets((prev) => prev.filter((a) => a.id !== target.id));
        toast.success("Asset deleted.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--admin-fg-muted)]">
          Every image uploaded through the admin (article covers, OG images, category share images, banners)
          is indexed here automatically.
        </p>
        <Button asChild size="sm" disabled={uploading}>
          <label className="cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        </Button>
      </div>

      {optimisticAssets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
            <ImagePlus className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-[var(--admin-fg)]">No images yet</p>
            <p className="text-[13px] text-[var(--admin-fg-muted)]">
              Upload one here, or through any image field in the admin.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {optimisticAssets.map((asset) => (
            <div
              key={asset.id}
              className={`group relative overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] ${
                deletingId === asset.id ? "opacity-50" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url} alt={asset.filename} className="aspect-square w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button type="button" size="icon" variant="secondary" onClick={() => handleCopy(asset.url)} aria-label="Copy URL">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => setDeleteTarget(asset)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2">
                <p className="truncate text-[12px] font-medium text-[var(--admin-fg)]">{asset.filename}</p>
                <p className="truncate text-[11px] text-[var(--admin-fg-muted)]">
                  {new Date(asset.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from storage entirely. If it&apos;s still used as a cover, OG, or banner image
              anywhere, that image will break — check before deleting.
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
