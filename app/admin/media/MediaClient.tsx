"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check,
  FolderPlus,
  Folder,
  FolderOpen,
  ImageOff,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
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
import { cn } from "../lib/cn";
import { uploadImage } from "../articles/upload-image";
import {
  bulkDeleteMediaAction,
  createMediaFolderAction,
  deleteMediaAssetAction,
  deleteMediaFolderAction,
  moveMediaAssetsAction,
  updateMediaAssetAction,
} from "./actions";
import type { MediaAsset, MediaFolder } from "../../lib/media";

type UsageEntry = { count: number; articles: { id: number; headline: string }[] };

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaClient({
  initialAssets,
  initialFolders,
  usageByUrl,
  canDelete,
}: {
  initialAssets: MediaAsset[];
  initialFolders: MediaFolder[];
  usageByUrl: Record<string, UsageEntry>;
  canDelete: boolean;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [folders, setFolders] = useState(initialFolders);
  const [query, setQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | "all" | "unfiled">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<MediaAsset | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; label: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<{ name: string; percent: number }[]>([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Nested dragenter/dragleave events fire for every child element, so a
  // plain boolean flickers. Counting enters vs. leaves is the standard fix.
  const dragDepth = useRef(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (activeFolder === "unfiled" && asset.folderId !== null) return false;
      if (activeFolder !== "all" && activeFolder !== "unfiled" && asset.folderId !== activeFolder) return false;
      if (!q) return true;
      return (
        asset.filename.toLowerCase().includes(q) ||
        (asset.alt ?? "").toLowerCase().includes(q) ||
        asset.tags.some((tag) => tag.includes(q))
      );
    });
  }, [assets, query, activeFolder]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleFiles(files: File[]) {
    const targetFolder = activeFolder === "all" || activeFolder === "unfiled" ? null : activeFolder;
    setUploads(files.map((f) => ({ name: f.name, percent: 0 })));

    for (const [index, file] of files.entries()) {
      try {
        const uploaded = await uploadImage(file, {
          folderId: targetFolder,
          onProgress: (percent) =>
            setUploads((prev) => prev.map((u, i) => (i === index ? { ...u, percent } : u))),
        });
        // Optimistically prepend so a long multi-file upload shows results
        // as it goes rather than all at once at the end. The real row is
        // written by the shared uploader; this mirrors it locally with the
        // same fields so a subsequent edit/delete targets the right thing
        // once the page refreshes.
        setAssets((prev) => [
          {
            id: `pending-${uploaded.url}`,
            url: uploaded.url,
            filename: uploaded.filename,
            alt: null,
            width: uploaded.width,
            height: uploaded.height,
            sizeBytes: uploaded.sizeBytes,
            mimeType: uploaded.mimeType,
            folderId: targetFolder,
            tags: [],
            uploadedByName: "You",
            uploadedByEmail: "",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Couldn't upload ${file.name}.`);
      }
    }

    setUploads([]);
    toast.success(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"}.`);
    // The optimistic rows above carry placeholder ids; a refresh swaps them
    // for the real indexed rows.
    startTransition(() => window.location.reload());
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const files = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) void handleFiles(files);
  }

  async function doDelete(ids: string[]) {
    const previous = assets;
    setAssets((prev) => prev.filter((a) => !ids.includes(a.id)));
    setSelected(new Set());
    setConfirmDelete(null);

    const result = ids.length === 1 ? await deleteMediaAssetAction(ids[0]) : await bulkDeleteMediaAction(ids);
    if (!result.success) {
      setAssets(previous);
      toast.error(result.error);
      return;
    }
    toast.success(`Deleted ${ids.length} file${ids.length === 1 ? "" : "s"}.`);
  }

  async function moveSelected(folderId: string | null) {
    const ids = Array.from(selected);
    const previous = assets;
    setAssets((prev) => prev.map((a) => (selected.has(a.id) ? { ...a, folderId } : a)));
    setSelected(new Set());

    const result = await moveMediaAssetsAction(ids, folderId);
    if (!result.success) {
      setAssets(previous);
      toast.error(result.error);
      return;
    }
    toast.success(`Moved ${ids.length} file${ids.length === 1 ? "" : "s"}.`);
  }

  async function createFolder() {
    const result = await createMediaFolderAction(newFolderName);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setFolders((prev) => [...prev, result.folder].sort((a, b) => a.name.localeCompare(b.name)));
    setNewFolderName("");
    setNewFolderOpen(false);
    toast.success(`Created "${result.folder.name}".`);
  }

  async function removeFolder(id: string, name: string) {
    const previous = folders;
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (activeFolder === id) setActiveFolder("all");
    setAssets((prev) => prev.map((a) => (a.folderId === id ? { ...a, folderId: null } : a)));

    const result = await deleteMediaFolderAction(id);
    if (!result.success) {
      setFolders(previous);
      toast.error(result.error);
      return;
    }
    toast.success(`Deleted "${name}". Its images moved to Unfiled.`);
  }

  const totalSize = assets.reduce((sum, a) => sum + (a.sizeBytes ?? 0), 0);

  return (
    <div
      className="flex flex-col gap-5"
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setDragging(false);
      }}
      onDrop={onDrop}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--admin-fg)]">Media Library</h1>
          <p className="text-[13px] text-[var(--admin-fg-muted)]">
            {assets.length} file{assets.length === 1 ? "" : "s"} · {formatBytes(totalSize)} · drop images anywhere on
            this page to upload
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="h-4 w-4" />
            New folder
          </Button>
          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploads.length > 0}>
            {uploads.length > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) void handleFiles(files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3">
          {uploads.map((upload) => (
            <div key={upload.name} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--admin-fg)]">{upload.name}</span>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[var(--admin-bg-subtle)]">
                <div
                  className="h-full bg-[var(--admin-primary)] transition-all"
                  style={{ width: `${upload.percent}%` }}
                />
              </div>
              <span className="w-9 text-right text-[11.5px] tabular-nums text-[var(--admin-fg-muted)]">
                {upload.percent}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_1fr]">
        <aside className="flex flex-col gap-1">
          {[
            { id: "all" as const, name: "All files", count: assets.length },
            { id: "unfiled" as const, name: "Unfiled", count: assets.filter((a) => !a.folderId).length },
          ].map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setActiveFolder(entry.id)}
              className={cn(
                "flex items-center justify-between rounded-md px-2.5 py-2 text-[13px] transition-colors",
                activeFolder === entry.id
                  ? "bg-[var(--admin-bg-subtle)] font-medium text-[var(--admin-fg)]"
                  : "text-[var(--admin-fg-muted)] hover:bg-[var(--admin-bg-subtle)]/60"
              )}
            >
              <span className="flex items-center gap-2">
                {activeFolder === entry.id ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                {entry.name}
              </span>
              <span className="tabular-nums">{entry.count}</span>
            </button>
          ))}

          {folders.map((folder) => (
            <div key={folder.id} className="group flex items-center">
              <button
                type="button"
                onClick={() => setActiveFolder(folder.id)}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-between rounded-md px-2.5 py-2 text-[13px] transition-colors",
                  activeFolder === folder.id
                    ? "bg-[var(--admin-bg-subtle)] font-medium text-[var(--admin-fg)]"
                    : "text-[var(--admin-fg-muted)] hover:bg-[var(--admin-bg-subtle)]/60"
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {activeFolder === folder.id ? (
                    <FolderOpen className="h-4 w-4 shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{folder.name}</span>
                </span>
                <span className="tabular-nums">{assets.filter((a) => a.folderId === folder.id).length}</span>
              </button>
              <button
                type="button"
                aria-label={`Delete folder ${folder.name}`}
                onClick={() => removeFolder(folder.id, folder.name)}
                className="ml-1 rounded p-1 text-[var(--admin-fg-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--admin-danger)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </aside>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--admin-fg-muted)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by filename, alt text, or tag"
              className="pl-8"
            />
          </div>

          {selected.size > 0 && (
            <div className="flex flex-col gap-2 rounded-md border border-[var(--admin-primary)]/30 bg-[var(--admin-primary)]/5 p-2.5 sm:flex-row sm:items-center">
              <span className="text-[13px] font-medium text-[var(--admin-fg)]">
                {selected.size} selected
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <select
                  className="h-9 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 text-[13px]"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    void moveSelected(e.target.value === "unfiled" ? null : e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="">Move to…</option>
                  <option value="unfiled">Unfiled</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
                {canDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setConfirmDelete({
                        ids: Array.from(selected),
                        label: `${selected.size} file${selected.size === 1 ? "" : "s"}`,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--admin-border)] py-16 text-center">
              <ImageOff className="h-7 w-7 text-[var(--admin-fg-muted)]" />
              <p className="text-sm font-medium text-[var(--admin-fg)]">
                {assets.length === 0 ? "No media yet" : "Nothing matches"}
              </p>
              <p className="max-w-sm text-[13px] text-[var(--admin-fg-muted)]">
                {assets.length === 0
                  ? "Drag images anywhere on this page, or hit Upload. Every image you add in the article editor lands here too."
                  : "Try a different search or folder."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((asset) => {
                const usage = usageByUrl[asset.url];
                const isSelected = selected.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={cn(
                      "group relative overflow-hidden rounded-md border bg-[var(--admin-surface)] transition-colors",
                      isSelected ? "border-[var(--admin-primary)]" : "border-[var(--admin-border)]"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setDetail(asset)}
                      className="block w-full text-left"
                      aria-label={`Details for ${asset.filename}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.alt ?? ""}
                        loading="lazy"
                        className="aspect-video w-full bg-[var(--admin-bg-subtle)] object-cover"
                      />
                      <div className="p-2">
                        <div className="truncate text-[12.5px] font-medium text-[var(--admin-fg)]">
                          {asset.filename}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--admin-fg-muted)]">
                          {asset.width && asset.height ? `${asset.width}×${asset.height}` : "—"}
                          <span>·</span>
                          {formatBytes(asset.sizeBytes)}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      aria-label={isSelected ? "Deselect" : "Select"}
                      onClick={() => toggleSelected(asset.id)}
                      className={cn(
                        "absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded border transition-opacity",
                        isSelected
                          ? "border-[var(--admin-primary)] bg-[var(--admin-primary)] text-white opacity-100"
                          : "border-white/70 bg-black/30 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>

                    <div className="absolute top-2 right-2 flex gap-1">
                      {usage ? (
                        <Badge variant="outline">
                          {usage.count} use{usage.count === 1 ? "" : "s"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Unused</Badge>
                      )}
                      {!asset.alt && <Badge variant="danger">No alt</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[var(--admin-primary)]/10 backdrop-blur-[1px]">
          <div className="rounded-lg border-2 border-dashed border-[var(--admin-primary)] bg-[var(--admin-surface)] px-8 py-6 text-center shadow-lg">
            <Upload className="mx-auto h-7 w-7 text-[var(--admin-primary)]" />
            <p className="mt-2 text-sm font-semibold text-[var(--admin-fg)]">Drop to upload</p>
          </div>
        </div>
      )}

      <AssetDetailDialog
        asset={detail}
        folders={folders}
        usage={detail ? usageByUrl[detail.url] : undefined}
        canDelete={canDelete}
        onClose={() => setDetail(null)}
        onSaved={(updated) => {
          setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setDetail(null);
        }}
        onDelete={(asset) => {
          setDetail(null);
          setConfirmDelete({ ids: [asset.id], label: asset.filename });
        }}
      />

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              maxLength={60}
              placeholder="Veterans coverage"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void createFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={createFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the file from storage, not just from this list. Anything still using it —
              including published articles — will show a broken image. This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && doDelete(confirmDelete.ids)}
              className="bg-[var(--admin-danger)] text-white hover:bg-[var(--admin-danger)]/90"
            >
              Delete for good
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {pending && <span className="sr-only">Refreshing…</span>}
    </div>
  );
}

function AssetDetailDialog({
  asset,
  folders,
  usage,
  canDelete,
  onClose,
  onSaved,
  onDelete,
}: {
  asset: MediaAsset | null;
  folders: MediaFolder[];
  usage: UsageEntry | undefined;
  canDelete: boolean;
  onClose: () => void;
  onSaved: (asset: MediaAsset) => void;
  onDelete: (asset: MediaAsset) => void;
}) {
  const [alt, setAlt] = useState("");
  const [tags, setTags] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Sync form state when a different asset is opened. Done during render
  // (rather than an effect) so the dialog never flashes the previous
  // asset's values for a frame.
  if (asset && asset.id !== loadedId) {
    setLoadedId(asset.id);
    setAlt(asset.alt ?? "");
    setTags(asset.tags.join(", "));
    setFolderId(asset.folderId ?? "");
  }

  if (!asset) return null;

  async function save() {
    if (!asset) return;
    setSaving(true);
    const result = await updateMediaAssetAction(asset.id, {
      alt,
      tags,
      folderId: folderId || null,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Saved.");
    onSaved({
      ...asset,
      alt: alt.trim() || null,
      tags: tags
        .split(",")
        .map((t) => t.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
      folderId: folderId || null,
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{asset.filename}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.url}
              alt={asset.alt ?? ""}
              className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg-subtle)] object-contain"
            />
            <dl className="mt-3 space-y-1 text-[12px] text-[var(--admin-fg-muted)]">
              <div className="flex justify-between">
                <dt>Dimensions</dt>
                <dd className="text-[var(--admin-fg)]">
                  {asset.width && asset.height ? `${asset.width}×${asset.height}` : "Unknown"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Size</dt>
                <dd className="text-[var(--admin-fg)]">{formatBytes(asset.sizeBytes)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Uploaded by</dt>
                <dd className="text-[var(--admin-fg)]">{asset.uploadedByName}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="asset-alt">Alt text</Label>
              <Input
                id="asset-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                maxLength={300}
                placeholder="Describe the image for screen readers"
              />
              <p className="text-[11.5px] text-[var(--admin-fg-muted)]">
                Reused every time this image is inserted into an article.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="asset-tags">Tags</Label>
              <Input
                id="asset-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="veterans, rally, tampa"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="asset-folder">Folder</Label>
              <select
                id="asset-folder"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="h-9 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 text-[13px]"
              >
                <option value="">Unfiled</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Used in</Label>
              {usage && usage.articles.length > 0 ? (
                <ul className="space-y-1">
                  {usage.articles.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="text-[12.5px] text-[var(--admin-primary)] hover:underline"
                      >
                        {article.headline}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12.5px] text-[var(--admin-fg-muted)]">
                  {usage ? "Used outside articles (a banner or category image)." : "Not used anywhere yet."}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="asset-url">URL</Label>
              <Input id="asset-url" readOnly value={asset.url} onFocus={(e) => e.currentTarget.select()} />
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {canDelete ? (
            <Button type="button" variant="destructive" onClick={() => onDelete(asset)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
