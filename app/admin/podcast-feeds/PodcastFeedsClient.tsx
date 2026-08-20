"use client";

import { useOptimistic, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Rss,
  Trash2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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
import {
  addPodcastFeedAction,
  deletePodcastAction,
  refreshPodcastAction,
  setPodcastActiveAction,
  updatePodcastAction,
} from "./actions";
import type { Podcast } from "../../lib/podcasts";

type OptimisticAction =
  | { type: "delete"; id: string }
  | { type: "active"; id: string; isActive: boolean };

function reducer(state: Podcast[], action: OptimisticAction): Podcast[] {
  switch (action.type) {
    case "delete":
      return state.filter((p) => p.id !== action.id);
    case "active":
      return state.map((p) => (p.id === action.id ? { ...p, isActive: action.isActive } : p));
  }
}

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PodcastFeedsClient({ initialPodcasts }: { initialPodcasts: Podcast[] }) {
  const [podcasts, setPodcasts] = useState(initialPodcasts);
  const [optimistic, applyOptimistic] = useOptimistic(podcasts, reducer);
  const [, startTransition] = useTransition();

  const [addOpen, setAddOpen] = useState(false);
  const [feedUrl, setFeedUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Podcast | null>(null);
  const [editSlug, setEditSlug] = useState("");
  const [editOrder, setEditOrder] = useState("0");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Podcast | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    const formData = new FormData();
    formData.set("feedUrl", feedUrl);
    const result = await addPodcastFeedAction(formData);
    setAdding(false);
    if (!result.success) {
      setAddError(result.error);
      return;
    }
    setPodcasts((prev) => [...prev, result.podcast]);
    setFeedUrl("");
    setAddOpen(false);
    toast.success(
      `Added ${result.podcast.title} — ${result.episodeCount} episode${result.episodeCount === 1 ? "" : "s"}.`
    );
  }

  async function handleRefresh(podcast: Podcast) {
    setRefreshingId(podcast.id);
    const result = await refreshPodcastAction(podcast.id);
    setRefreshingId(null);
    if (!result.success) {
      toast.error(result.error);
      // The row's stored error changed even though the refresh failed, so
      // reflect that rather than leaving stale "last checked" text.
      setPodcasts((prev) =>
        prev.map((p) =>
          p.id === podcast.id
            ? { ...p, lastFetchedAt: new Date().toISOString(), lastFetchError: result.error }
            : p
        )
      );
      return;
    }
    setPodcasts((prev) => prev.map((p) => (p.id === podcast.id ? result.podcast : p)));
    toast.success(
      `${result.podcast.title} refreshed — ${result.episodeCount} episode${result.episodeCount === 1 ? "" : "s"}.`
    );
  }

  function handleToggleActive(podcast: Podcast, isActive: boolean) {
    startTransition(async () => {
      applyOptimistic({ type: "active", id: podcast.id, isActive });
      const result = await setPodcastActiveAction(podcast.id, isActive);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setPodcasts((prev) => prev.map((p) => (p.id === podcast.id ? { ...p, isActive } : p)));
    });
  }

  function openEdit(podcast: Podcast) {
    setEditing(podcast);
    setEditSlug(podcast.slug);
    setEditOrder(String(podcast.sortOrder));
    setEditError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    setSavingEdit(true);
    const formData = new FormData();
    formData.set("slug", editSlug);
    formData.set("sortOrder", editOrder);
    const result = await updatePodcastAction(editing.id, formData);
    setSavingEdit(false);
    if (!result.success) {
      setEditError(result.error);
      return;
    }
    setPodcasts((prev) =>
      prev.map((p) =>
        p.id === editing.id ? { ...p, slug: editSlug, sortOrder: Number(editOrder) } : p
      )
    );
    setEditing(null);
    toast.success("Show updated.");
  }

  async function confirmDelete() {
    const target = deleting;
    if (!target) return;
    setDeletePending(true);
    startTransition(async () => {
      applyOptimistic({ type: "delete", id: target.id });
      const result = await deletePodcastAction(target.id, target.title);
      setDeletePending(false);
      setDeleting(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setPodcasts((prev) => prev.filter((p) => p.id !== target.id));
      toast.success(`Removed ${target.title}.`);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Podcast Feeds</h1>
          <p className="mt-1 text-[13px] text-[var(--admin-fg-muted)]">
            Paste a show&rsquo;s RSS feed and it gets its own page, with episodes pulled straight
            from the feed. Up to 100 of the newest episodes per show.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add feed
        </Button>
      </div>

      {optimistic.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--admin-border)] px-6 py-14 text-center">
          <Rss className="mx-auto h-8 w-8 text-[var(--admin-fg-muted)]" />
          <p className="mt-3 text-[14px] font-medium">No shows yet</p>
          <p className="mx-auto mt-1 max-w-[46ch] text-[13px] text-[var(--admin-fg-muted)]">
            Add a podcast&rsquo;s RSS feed URL and its cover art, description and episodes appear on
            the site automatically.
          </p>
          <Button className="mt-4" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add your first feed
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Show</TableHead>
                <TableHead className="text-right">Episodes</TableHead>
                <TableHead>Last checked</TableHead>
                <TableHead>Live</TableHead>
                <TableHead className="w-[170px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimistic.map((podcast) => (
                <TableRow key={podcast.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {podcast.coverImageUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded ring-1 ring-black/10">
                          <Image
                            src={podcast.coverImageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[var(--admin-bg-subtle)]">
                          <Rss className="h-4 w-4 text-[var(--admin-fg-muted)]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium">{podcast.title}</div>
                        <div className="font-mono text-[12px] text-[var(--admin-fg-muted)]">
                          /podcasts/{podcast.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{podcast.episodeCount}</TableCell>
                  <TableCell>
                    <div className="text-[13px]">{formatWhen(podcast.lastFetchedAt)}</div>
                    {podcast.lastFetchError && (
                      <div
                        className="mt-0.5 flex items-start gap-1 text-[12px] text-[var(--admin-danger)]"
                        title={podcast.lastFetchError}
                      >
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{podcast.lastFetchError}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={podcast.isActive}
                      onCheckedChange={(v) => handleToggleActive(podcast, v)}
                      aria-label={`${podcast.isActive ? "Hide" : "Show"} ${podcast.title} on the site`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefresh(podcast)}
                        disabled={refreshingId === podcast.id}
                        aria-label={`Refresh ${podcast.title}`}
                      >
                        {refreshingId === podcast.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(podcast)}
                        aria-label={`Edit ${podcast.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/podcasts/${podcast.slug}`}
                          target="_blank"
                          aria-label={`View ${podcast.title}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(podcast)}
                        aria-label={`Delete ${podcast.title}`}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add a podcast feed</DialogTitle>
            <DialogDescription>
              Paste the show&rsquo;s RSS feed URL. Everything else — title, cover art, description
              and episodes — comes from the feed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            {addError && (
              <p className="rounded-md border border-[var(--admin-danger-bg)] bg-[var(--admin-danger-bg)] px-3 py-2 text-[13px] text-[var(--admin-danger)]">
                {addError}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="feed-url">RSS feed URL</Label>
              <Input
                id="feed-url"
                type="url"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://feeds.example.com/my-show.xml"
                required
                autoFocus
                disabled={adding}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
                Cancel
              </Button>
              <Button type="submit" disabled={adding || !feedUrl.trim()}>
                {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                {adding ? "Fetching feed…" : "Add show"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit {editing?.title}</DialogTitle>
            <DialogDescription>
              Title, artwork and episodes all come from the feed and are replaced on every refresh.
              These two are yours.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            {editError && (
              <p className="rounded-md border border-[var(--admin-danger-bg)] bg-[var(--admin-danger-bg)] px-3 py-2 text-[13px] text-[var(--admin-danger)]">
                {editError}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="podcast-slug">Page address</Label>
              <Input
                id="podcast-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                className="font-mono text-[13px]"
                required
                maxLength={80}
              />
              <p className="text-[12px] text-[var(--admin-fg-muted)]">
                /podcasts/{editSlug || "…"} — changing this breaks any link already shared.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="podcast-order">Order</Label>
              <Input
                id="podcast-order"
                type="number"
                value={editOrder}
                onChange={(e) => setEditOrder(e.target.value)}
                className="w-28"
              />
              <p className="text-[12px] text-[var(--admin-fg-muted)]">
                Lower numbers come first on the podcasts page.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the show&rsquo;s page and its {deleting?.episodeCount} imported episode
              {deleting?.episodeCount === 1 ? "" : "s"}. Nothing is removed from the podcast host
              itself — you can add the feed again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deletePending}>
              {deletePending && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove show
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
