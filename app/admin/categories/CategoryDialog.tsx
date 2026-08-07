"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { slugify } from "../../lib/slugify";
import type { Category } from "../../lib/categories";
import type { CategoryActionResult } from "./actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSubmit: (formData: FormData) => Promise<CategoryActionResult>;
  onSuccess: (category: Category) => void;
};

export default function CategoryDialog({ open, onOpenChange, category, onSubmit, onSuccess }: Props) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.label ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.label ?? "");
      setSlug(category?.slug ?? "");
      setSlugTouched(isEdit);
      setDescription(category?.description ?? "");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("slug", slug);
    formData.set("description", description);

    const result = await onSubmit(formData);
    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    onSuccess(result.category);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Renaming the slug re-files every article under it automatically."
              : "Categories organize articles across the site's nav and category pages."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-md border border-[var(--admin-danger-bg)] bg-[var(--admin-danger-bg)] px-3 py-2 text-[13px] text-[var(--admin-danger)]">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              required
              autoFocus
              maxLength={60}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Political News"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={slug}
              required
              maxLength={80}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              placeholder="political-news"
              className="font-mono text-[13px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Shown at the top of the category page."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim() || !slug.trim()}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
