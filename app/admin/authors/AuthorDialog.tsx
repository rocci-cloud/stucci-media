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
import ImageField from "../articles/ImageField";
import { slugify } from "../../lib/slugify";
import type { Author } from "../../lib/authors";
import type { AuthorActionResult } from "./actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  author?: Author | null;
  /** Pre-fills the form when creating a profile for an existing byline. */
  presetName?: string;
  presetSlug?: string;
  onSubmit: (formData: FormData) => Promise<AuthorActionResult>;
  onSuccess: (author: Author) => void;
};

export default function AuthorDialog({
  open,
  onOpenChange,
  author,
  presetName,
  presetSlug,
  onSubmit,
  onSuccess,
}: Props) {
  const isEdit = Boolean(author);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(author?.name ?? presetName ?? "");
    setSlug(author?.slug ?? presetSlug ?? "");
    // The slug has to keep matching the byline on the articles, so once it's
    // derived from a real byline it's treated as deliberate, not a draft.
    setSlugTouched(Boolean(author || presetSlug));
    setTitle(author?.title ?? "");
    setBio(author?.bio ?? "");
    setAvatarUrl(author?.avatarUrl ?? null);
    setWebsiteUrl(author?.websiteUrl ?? "");
    setTwitterUrl(author?.twitterUrl ?? "");
    setFacebookUrl(author?.facebookUrl ?? "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, author?.id, presetSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("slug", slug);
    formData.set("title", title);
    formData.set("bio", bio);
    formData.set("avatarUrl", avatarUrl ?? "");
    formData.set("websiteUrl", websiteUrl);
    formData.set("twitterUrl", twitterUrl);
    formData.set("facebookUrl", facebookUrl);

    const result = await onSubmit(formData);
    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    onSuccess(result.author);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit author profile" : "New author profile"}</DialogTitle>
          <DialogDescription>
            The slug must match the byline on the articles — that&apos;s how the profile attaches
            to them.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-md border border-[var(--admin-danger-bg)] bg-[var(--admin-danger-bg)] px-3 py-2 text-[13px] text-[var(--admin-danger)]">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="author-name">Name</Label>
            <Input
              id="author-name"
              value={name}
              required
              autoFocus
              maxLength={80}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Rocci Stucci"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="author-slug">Slug</Label>
            <Input
              id="author-slug"
              value={slug}
              required
              maxLength={80}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              placeholder="rocci-stucci"
              className="font-mono text-[13px]"
            />
            <p className="text-[12px] text-[var(--admin-fg-muted)]">
              Page will live at /author/{slug || "…"}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="author-title">Title (optional)</Label>
            <Input
              id="author-title"
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Investigative Reporter"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="author-bio">Bio (optional)</Label>
            <Textarea
              id="author-bio"
              value={bio}
              rows={4}
              maxLength={600}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Shown on the author page and used as its meta description."
            />
          </div>

          <ImageField label="Photo (optional)" value={avatarUrl} onChange={setAvatarUrl} />

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="author-website">Website (optional)</Label>
              <Input
                id="author-website"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="author-twitter">X profile (optional)</Label>
              <Input
                id="author-twitter"
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="author-facebook">Facebook profile (optional)</Label>
              <Input
                id="author-facebook"
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save profile" : "Create profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
