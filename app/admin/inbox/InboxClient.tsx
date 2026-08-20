"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCircle2,
  Inbox as InboxIcon,
  Loader2,
  Mail,
  Mic,
  Rss,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
  approveAndImportAction,
  deleteSubmissionAction,
  setSubmissionStatusAction,
} from "./actions";
import type { Submission, SubmissionStatus } from "../../lib/submissions";

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  NEW: "New",
  REVIEWING: "Reviewing",
  APPROVED: "Approved",
  DECLINED: "Declined",
  ARCHIVED: "Archived",
};

type OptimisticAction = { type: "delete"; id: string };

function reducer(state: Submission[], action: OptimisticAction): Submission[] {
  return state.filter((s) => s.id !== action.id);
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InboxClient({ initial }: { initial: Submission[] }) {
  const [submissions, setSubmissions] = useState(initial);
  const [optimistic, applyOptimistic] = useOptimistic(submissions, reducer);
  const [, startTransition] = useTransition();

  const [kindFilter, setKindFilter] = useState<"all" | "PODCAST" | "GENERAL">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [deleting, setDeleting] = useState<Submission | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return optimistic.filter((s) => {
      if (kindFilter !== "all" && s.kind !== kindFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return [s.name, s.email, s.showName ?? "", s.subject ?? "", s.message]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [optimistic, kindFilter, statusFilter, query]);

  const selected = optimistic.find((s) => s.id === selectedId) ?? visible[0] ?? null;
  const newCount = optimistic.filter((s) => s.status === "NEW").length;

  function select(submission: Submission) {
    setSelectedId(submission.id);
    setNotes(submission.adminNotes ?? "");
  }

  function applyUpdate(updated: Submission) {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  async function setStatus(status: SubmissionStatus) {
    if (!selected) return;
    setBusy(true);
    const result = await setSubmissionStatusAction(selected.id, status, notes || null);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    applyUpdate(result.submission);
    toast.success(`Marked ${STATUS_LABEL[status].toLowerCase()}.`);
  }

  async function approveAndImport() {
    if (!selected) return;
    setBusy(true);
    const result = await approveAndImportAction(selected.id);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    applyUpdate(result.submission);
    toast.success(
      `Added the show — ${result.episodeCount} episode${result.episodeCount === 1 ? "" : "s"} imported.`
    );
  }

  async function confirmDelete() {
    const target = deleting;
    if (!target) return;
    setBusy(true);
    startTransition(async () => {
      applyOptimistic({ type: "delete", id: target.id });
      const result = await deleteSubmissionAction(target.id, target.showName ?? target.name);
      setBusy(false);
      setDeleting(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== target.id));
      if (selectedId === target.id) setSelectedId(null);
      toast.success("Submission deleted.");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Inbox</h1>
        <p className="mt-1 text-[13px] text-[var(--admin-fg-muted)]">
          Contact messages and podcast pitches. {newCount} unread.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-fg-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search submissions…"
            className="pl-9"
            aria-label="Search submissions"
          />
        </div>
        <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as typeof kindFilter)}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="PODCAST">Podcast pitches</SelectItem>
            <SelectItem value="GENERAL">Messages</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as SubmissionStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {optimistic.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--admin-border)] px-6 py-14 text-center">
          <InboxIcon className="mx-auto h-8 w-8 text-[var(--admin-fg-muted)]" />
          <p className="mt-3 text-[14px] font-medium">Nothing here yet</p>
          <p className="mx-auto mt-1 max-w-[46ch] text-[13px] text-[var(--admin-fg-muted)]">
            Messages from the contact form and podcast pitches both land here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
          <div className="flex max-h-[70vh] flex-col overflow-y-auto rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]">
            {visible.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-[var(--admin-fg-muted)]">
                Nothing matches those filters.
              </p>
            ) : (
              visible.map((s) => (
                <button
                  key={s.id}
                  onClick={() => select(s)}
                  className={`flex flex-col gap-1 border-b border-[var(--admin-border)] px-4 py-3 text-left transition-colors last:border-b-0 ${
                    selected?.id === s.id
                      ? "bg-[var(--admin-primary)]/8"
                      : "hover:bg-[var(--admin-bg-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {s.kind === "PODCAST" ? (
                      <Mic className="h-3.5 w-3.5 shrink-0 text-[var(--admin-primary)]" />
                    ) : (
                      <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--admin-fg-muted)]" />
                    )}
                    <span className="truncate text-[13.5px] font-medium">
                      {s.showName ?? s.subject ?? s.name}
                    </span>
                    {s.status === "NEW" && (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[var(--admin-primary)]" />
                    )}
                  </div>
                  <div className="truncate text-[12px] text-[var(--admin-fg-muted)]">
                    {s.name} · {formatWhen(s.createdAt)}
                  </div>
                </button>
              ))
            )}
          </div>

          {selected ? (
            <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selected.kind === "PODCAST" ? undefined : "outline"}>
                      {selected.kind === "PODCAST" ? "Podcast pitch" : "Message"}
                    </Badge>
                    <Badge variant="outline">{STATUS_LABEL[selected.status]}</Badge>
                    {selected.importedPodcastId && <Badge>Added to site</Badge>}
                  </div>
                  <h2 className="mt-2 text-[18px] font-semibold">
                    {selected.showName ?? selected.subject ?? "Message"}
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(selected)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13.5px]">
                <dt className="text-[var(--admin-fg-muted)]">From</dt>
                <dd>
                  {selected.name}{" "}
                  <a href={`mailto:${selected.email}`} className="text-[var(--admin-primary)] hover:underline">
                    &lt;{selected.email}&gt;
                  </a>
                </dd>
                {selected.contact && (
                  <>
                    <dt className="text-[var(--admin-fg-muted)]">Contact</dt>
                    <dd>{selected.contact}</dd>
                  </>
                )}
                {selected.feedUrl && (
                  <>
                    <dt className="text-[var(--admin-fg-muted)]">RSS feed</dt>
                    <dd className="min-w-0">
                      <a
                        href={selected.feedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-mono text-[12.5px] text-[var(--admin-primary)] hover:underline"
                      >
                        {selected.feedUrl}
                      </a>
                    </dd>
                  </>
                )}
                <dt className="text-[var(--admin-fg-muted)]">Received</dt>
                <dd>{formatWhen(selected.createdAt)}</dd>
              </dl>

              <div className="mt-4 whitespace-pre-wrap rounded-md border-l-[3px] border-[var(--admin-primary)] bg-[var(--admin-bg-subtle)] px-4 py-3 text-[14px] leading-[1.6]">
                {selected.message}
              </div>

              <div className="mt-4 flex flex-col gap-1.5">
                <Label htmlFor="admin-notes">Private notes</Label>
                <Textarea
                  id="admin-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Only you see this."
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selected.kind === "PODCAST" && selected.feedUrl && !selected.importedPodcastId && (
                  <Button onClick={approveAndImport} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rss className="h-4 w-4" />}
                    Approve &amp; add show
                  </Button>
                )}
                {selected.importedPodcastId && (
                  <Button variant="outline" asChild>
                    <Link href="/admin/podcast-feeds">
                      <Rss className="h-4 w-4" />
                      Manage show
                    </Link>
                  </Button>
                )}
                <Button variant="outline" onClick={() => setStatus("REVIEWING")} disabled={busy}>
                  Reviewing
                </Button>
                <Button variant="outline" onClick={() => setStatus("APPROVED")} disabled={busy}>
                  <CheckCircle2 className="h-4 w-4" />
                  Approved
                </Button>
                <Button variant="outline" onClick={() => setStatus("DECLINED")} disabled={busy}>
                  <XCircle className="h-4 w-4" />
                  Declined
                </Button>
                <Button variant="outline" onClick={() => setStatus("ARCHIVED")} disabled={busy}>
                  Archive
                </Button>
              </div>

              <p className="mt-3 text-[12px] text-[var(--admin-fg-muted)]">
                Status changes save your notes too. Nothing here is emailed to the sender — reply
                from your own inbox.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--admin-border)] px-6 py-14 text-center text-[13px] text-[var(--admin-fg-muted)]">
              Pick a submission to read it.
            </div>
          )}
        </div>
      )}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it permanently. If a show was already added from it, the show itself
              stays on the site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={busy}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
