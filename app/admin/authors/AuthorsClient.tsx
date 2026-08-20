"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Loader2, Pencil, Plus, Search, Trash2, UserPlus } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import AuthorDialog from "./AuthorDialog";
import { createAuthorAction, deleteAuthorAction, updateAuthorAction } from "./actions";
import type { Author } from "../../lib/authors";

export type BylineRow = {
  slug: string;
  name: string;
  count: number;
  profile: Author | null;
};

type OptimisticAction = { type: "removeProfile"; slug: string };

function reducer(state: BylineRow[], action: OptimisticAction): BylineRow[] {
  switch (action.type) {
    case "removeProfile":
      // The byline itself never disappears — only its profile does.
      return state.map((r) => (r.slug === action.slug ? { ...r, profile: null } : r));
  }
}

export default function AuthorsClient({ initialBylines }: { initialBylines: BylineRow[] }) {
  const [bylines, setBylines] = useState(initialBylines);
  const [optimisticBylines, applyOptimistic] = useOptimistic(bylines, reducer);
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const [preset, setPreset] = useState<{ name: string; slug: string } | null>(null);
  const [deleting, setDeleting] = useState<BylineRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return optimisticBylines;
    return optimisticBylines.filter(
      (r) => r.name.toLowerCase().includes(q) || r.slug.includes(q)
    );
  }, [optimisticBylines, query]);

  const withProfile = optimisticBylines.filter((r) => r.profile).length;

  function openNew() {
    setEditing(null);
    setPreset(null);
    setDialogOpen(true);
  }

  function openForByline(row: BylineRow) {
    setEditing(row.profile);
    setPreset(row.profile ? null : { name: row.name, slug: row.slug });
    setDialogOpen(true);
  }

  function handleSaved(author: Author) {
    setBylines((prev) => {
      const existing = prev.find((r) => r.slug === author.slug);
      if (existing) {
        return prev.map((r) =>
          r.slug === author.slug ? { ...r, name: author.name, profile: author } : r
        );
      }
      // A profile can be created for a byline that has no published articles
      // yet — surface it rather than silently saving something invisible.
      return [...prev, { slug: author.slug, name: author.name, count: 0, profile: author }];
    });
    toast.success(`Saved profile for ${author.name}.`);
  }

  async function confirmDelete() {
    const row = deleting;
    if (!row?.profile) return;
    setDeletePending(true);
    const profileId = row.profile.id;

    startTransition(async () => {
      applyOptimistic({ type: "removeProfile", slug: row.slug });
      const result = await deleteAuthorAction(profileId, row.name);
      setDeletePending(false);
      setDeleting(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setBylines((prev) => prev.map((r) => (r.slug === row.slug ? { ...r, profile: null } : r)));
      toast.success(`Removed the profile for ${row.name}. Their byline and page are unchanged.`);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Authors</h1>
          <p className="mt-1 text-[13px] text-[var(--admin-fg-muted)]">
            Every byline on the site has an author page. {withProfile} of {optimisticBylines.length}{" "}
            {optimisticBylines.length === 1 ? "has" : "have"} a profile filled in.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          New profile
        </Button>
      </div>

      <div className="relative max-w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-fg-muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search authors…"
          className="pl-9"
          aria-label="Search authors"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead className="text-right">Stories</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-[13px] text-[var(--admin-fg-muted)]">
                  {query ? "No authors match that search." : "No bylines yet — publish an article first."}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => (
                <TableRow key={row.slug}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="font-mono text-[12px] text-[var(--admin-fg-muted)]">
                      /author/{row.slug}
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.profile ? (
                      <Badge>Complete</Badge>
                    ) : (
                      <Badge variant="outline">Not set up</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openForByline(row)}
                        aria-label={row.profile ? `Edit ${row.name}` : `Add a profile for ${row.name}`}
                      >
                        {row.profile ? (
                          <Pencil className="h-4 w-4" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/author/${row.slug}`}
                          target="_blank"
                          aria-label={`View ${row.name}'s page`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!row.profile}
                        onClick={() => setDeleting(row)}
                        aria-label={`Delete ${row.name}'s profile`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AuthorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        author={editing}
        presetName={preset?.name}
        presetSlug={preset?.slug}
        onSubmit={(formData) =>
          editing ? updateAuthorAction(editing.id, formData) : createAuthorAction(formData)
        }
        onSuccess={handleSaved}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}&apos;s profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Their articles and author page stay exactly as they are — the page just loses the
              bio, photo and links until a profile is added again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deletePending}>
              {deletePending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
