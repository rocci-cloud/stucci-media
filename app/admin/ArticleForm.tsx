"use client";

import { useActionState, useState } from "react";
import { upload } from "@vercel/blob/client";
import { categories } from "../lib/categories";
import type { Article } from "../lib/articles";
import type { ArticleFormState } from "./articles/actions";

type Props = {
  article?: Article;
  action: (prevState: ArticleFormState, formData: FormData) => Promise<ArticleFormState>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const fieldClass = "border border-[var(--color-hairline-strong)] px-3 py-2 font-normal";

export default function ArticleForm({ article, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [headline, setHeadline] = useState(article?.headline ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [coverImageUrl, setCoverImageUrl] = useState(article?.coverImageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      setCoverImageUrl(blob.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 font-sans max-w-[640px]">
      {state.error && (
        <p className="text-sm text-[var(--color-red)] border border-[var(--color-red)] px-3 py-2">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Headline
        <input
          name="headline"
          value={headline}
          onChange={(e) => {
            setHeadline(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Slug
        <input
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value));
            setSlugTouched(true);
          }}
          required
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Category
        <select
          name="categorySlug"
          defaultValue={article?.categorySlug ?? categories[0].slug}
          required
          className={fieldClass}
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Dek
        <textarea name="dek" defaultValue={article?.dek} required rows={2} className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Author
        <input name="author" defaultValue={article?.author ?? "Rocci Stucci"} className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Body
        <span className="font-normal text-xs text-[var(--color-gray)]">
          Plain paragraphs separated by a blank line, or HTML (
          <code>&lt;h2&gt;</code>, <code>&lt;b&gt;</code>, <code>&lt;a&gt;</code>, <code>&lt;img&gt;</code>, etc.)
          for richer formatting — it&apos;s sanitized on save either way.
        </span>
        <textarea
          name="body"
          defaultValue={article?.bodyHtml}
          required
          rows={14}
          className={`${fieldClass} leading-relaxed font-mono text-[13px]`}
        />
      </label>

      <div className="flex flex-col gap-1.5 text-sm font-bold">
        Cover image
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
        {uploading && <p className="text-xs font-normal text-[var(--color-gray)]">Uploading…</p>}
        {uploadError && <p className="text-xs font-normal text-[var(--color-red)]">{uploadError}</p>}
        {coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt="Cover preview"
            className="w-full max-w-xs aspect-video object-cover border border-[var(--color-hairline)] mt-2"
          />
        )}
        <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
      </div>

      <fieldset className="flex gap-5 text-sm font-bold">
        <legend className="mb-1">Status</legend>
        <label className="flex items-center gap-1.5 font-normal">
          <input type="radio" name="status" value="draft" defaultChecked={!article || article.status === "draft"} />
          Draft
        </label>
        <label className="flex items-center gap-1.5 font-normal">
          <input type="radio" name="status" value="published" defaultChecked={article?.status === "published"} />
          Published
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={pending || uploading}
        className="bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-sm font-bold uppercase tracking-wide px-5 py-3 rounded-sm disabled:opacity-50 self-start"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
