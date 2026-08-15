"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AudioLines, Mic, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
import { deleteEpisodeAction } from "./actions";
import type { PodcastEpisode } from "../../lib/podcast";
import { formatDuration } from "../../lib/podcast-duration";
import { ARTICLE_STATUS_LABELS } from "../../lib/article-status";

function reducer(state: PodcastEpisode[], id: string): PodcastEpisode[] {
  return state.filter((e) => e.id !== id);
}

export default function PodcastClient({
  episodes: initial,
  canDelete,
}: {
  episodes: PodcastEpisode[];
  canDelete: boolean;
}) {
  const [episodes, setEpisodes] = useState(initial);
  const [optimistic, apply] = useOptimistic(episodes, reducer);
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PodcastEpisode | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return optimistic;
    return optimistic.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.subtitle ?? "").toLowerCase().includes(q) ||
        (e.guestName ?? "").toLowerCase().includes(q)
    );
  }, [optimistic, query]);

  function remove(episode: PodcastEpisode) {
    setDeleteTarget(null);
    startTransition(async () => {
      apply(episode.id);
      const result = await deleteEpisodeAction(episode.id, episode.title);
      if (result.success) {
        setEpisodes((prev) => prev.filter((e) => e.id !== episode.id));
        toast.success(`"${episode.title}" deleted.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--admin-fg-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search episodes…"
            className="pl-8"
            aria-label="Search episodes"
          />
        </div>
        <Button asChild size="sm">
          <Link href="/admin/podcast/new">
            <Plus className="h-4 w-4" />
            New episode
          </Link>
        </Button>
      </div>

      {optimistic.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-subtle)] text-[var(--admin-fg-muted)]">
            <Mic className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-[var(--admin-fg)]">No episodes yet</p>
            <p className="text-[13px] text-[var(--admin-fg-muted)]">
              Add the first episode of The Rocci Stucci Show. Upload the audio or point at a URL you already host.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/podcast/new">
              <Plus className="h-4 w-4" />
              New episode
            </Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
          <p className="text-sm font-semibold text-[var(--admin-fg)]">No matches</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Episode</TableHead>
                <TableHead className="hidden lg:table-cell">Guest</TableHead>
                <TableHead className="hidden sm:table-cell">Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Released</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((episode) => (
                <TableRow key={episode.id}>
                  <TableCell className="text-[var(--admin-fg-muted)] tabular-nums">
                    {episode.episodeNumber ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[180px] sm:max-w-[340px]">
                    <Link href={`/admin/podcast/${episode.id}/edit`} className="block truncate font-medium hover:underline">
                      {episode.title}
                    </Link>
                    <span className="flex items-center gap-1 truncate text-[11.5px] text-[var(--admin-fg-muted)]">
                      {episode.audioUrl ? (
                        <>
                          <AudioLines className="h-3 w-3 shrink-0" />
                          Audio attached
                        </>
                      ) : (
                        "No audio yet"
                      )}
                      {episode.transcript && " · transcript"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-[13px] text-[var(--admin-fg-muted)] lg:table-cell">
                    {episode.guestName ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-[13px] text-[var(--admin-fg-muted)] tabular-nums sm:table-cell">
                    {formatDuration(episode.durationSeconds)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        episode.status === "published"
                          ? "success"
                          : episode.status === "in_review"
                            ? "default"
                            : "outline"
                      }
                    >
                      {ARTICLE_STATUS_LABELS[episode.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-[13px] text-[var(--admin-fg-muted)] md:table-cell">
                    {episode.publishedAt ? episode.date : "—"}
                  </TableCell>
                  <TableCell>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${episode.title}`}
                        onClick={() => setDeleteTarget(episode)}
                        className="text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              The episode comes off the site. The audio file itself stays in the media store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && remove(deleteTarget)}
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
