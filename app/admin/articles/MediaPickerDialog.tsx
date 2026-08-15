"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2, Search, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { cn } from "../lib/cn";
import { listMediaAssetsAction } from "../media/actions";
import { uploadImage, ImageUploadError, suggestAltText } from "./upload-image";
import type { MediaAsset } from "../../lib/media";

export type PickedImage = { url: string; alt: string };

/**
 * The "reuse an image you've already uploaded" picker, shared by the
 * article editor's inline image insert and the featured/OG image fields.
 * Also handles uploading a brand new file, so an author never has to
 * decide up front which flow they're in — one dialog does both.
 */
export default function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (image: PickedImage) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listMediaAssetsAction()
      .then((result) => {
        if (cancelled) return;
        if (result.success) setAssets(result.assets);
        else setError(result.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? assets.filter(
        (a) =>
          a.filename.toLowerCase().includes(q) ||
          (a.alt ?? "").toLowerCase().includes(q) ||
          a.tags.some((tag) => tag.includes(q))
      )
    : assets;

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const uploaded = await uploadImage(file, { onProgress: setProgress });
      onSelect({ url: uploaded.url, alt: suggestAltText(uploaded.filename) });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ImageUploadError || err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Insert image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--admin-fg-muted)]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by filename, alt text, or tag"
                className="pl-8"
              />
            </div>
            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? `Uploading ${progress}%` : "Upload new"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {error && <p className="text-[13px] text-[var(--admin-danger)]">{error}</p>}

          <div className="max-h-[420px] min-h-[220px] overflow-y-auto rounded-md border border-[var(--admin-border)] p-2">
            {loading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-video animate-pulse rounded bg-[var(--admin-bg-subtle)]" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
                <ImageOff className="h-6 w-6 text-[var(--admin-fg-muted)]" />
                <p className="text-[13px] font-medium text-[var(--admin-fg)]">
                  {assets.length === 0 ? "Nothing in the library yet" : "No matches"}
                </p>
                <p className="max-w-xs text-[12px] text-[var(--admin-fg-muted)]">
                  {assets.length === 0
                    ? "Upload an image and it'll be here next time you need it."
                    : "Try a different search, or upload a new image."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {visible.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      onSelect({ url: asset.url, alt: asset.alt ?? suggestAltText(asset.filename) });
                      onOpenChange(false);
                    }}
                    className={cn(
                      "group relative overflow-hidden rounded border border-[var(--admin-border)] transition-colors",
                      "hover:border-[var(--admin-primary)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={asset.alt ?? ""}
                      loading="lazy"
                      className="aspect-video w-full bg-[var(--admin-bg-subtle)] object-cover"
                    />
                    <span className="block truncate px-1.5 py-1 text-left text-[11px] text-[var(--admin-fg-muted)]">
                      {asset.filename}
                    </span>
                    {!asset.alt && (
                      <span className="absolute top-1 right-1 rounded bg-[var(--admin-danger)] px-1 py-0.5 text-[9.5px] font-semibold text-white">
                        NO ALT
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
