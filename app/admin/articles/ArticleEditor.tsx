"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Sparkles, Zap } from "lucide-react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import RichTextEditor from "./RichTextEditor";
import CategoryMultiSelect from "./CategoryMultiSelect";
import ImageField from "./ImageField";
import SeoPanel from "./SeoPanel";
import { slugify } from "../../lib/slugify";
import { computeSeoScore } from "../../lib/seo-score";
import type { Article } from "../../lib/articles";
import type { Category } from "../../lib/categories";
import type { ArticleFormState } from "./actions";

type Props = {
  article?: Article;
  categories: Category[];
  action: (prevState: ArticleFormState, formData: FormData) => Promise<ArticleFormState>;
  siteUrl: string;
};

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ArticleEditor({ article, categories: initialCategories, action, siteUrl }: Props) {
  const isEdit = Boolean(article);
  const [state, formAction, pending] = useActionState(action, {});

  const [tab, setTab] = useState<"content" | "engagement" | "seo">("content");

  const [headline, setHeadline] = useState(article?.headline ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [dek, setDek] = useState(article?.dek ?? "");
  const [author, setAuthor] = useState(article?.author ?? "Rocci Stucci");
  const [bodyHtml, setBodyHtml] = useState(article?.bodyHtml ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(article?.coverImageUrl ?? null);
  const [status, setStatus] = useState<"draft" | "published">(article?.status ?? "draft");
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured ?? false);
  const [isExclusive, setIsExclusive] = useState(article?.isExclusive ?? false);
  const [publishedAt, setPublishedAt] = useState(toLocalInputValue(article?.publishedAt ?? null));
  const [tags, setTags] = useState((article?.tags ?? []).map((t) => `#${t}`).join(", "));
  const [bulletPoints, setBulletPoints] = useState((article?.bulletPoints ?? []).join("\n"));
  const [comparisonTitle, setComparisonTitle] = useState(article?.comparisonTitle ?? "");
  const [comparisonBody, setComparisonBody] = useState(article?.comparisonBody ?? "");
  const [comparisonSourceLabel, setComparisonSourceLabel] = useState(article?.comparisonSourceLabel ?? "");
  const [comparisonSourceUrl, setComparisonSourceUrl] = useState(article?.comparisonSourceUrl ?? "");

  const isScheduled = status === "published" && Boolean(publishedAt) && new Date(publishedAt) > new Date();

  const [categories, setCategories] = useState(initialCategories);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    article?.categorySlugs ?? (initialCategories[0] ? [initialCategories[0].slug] : [])
  );

  const [seoTitle, setSeoTitle] = useState(article?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(article?.seoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState(article?.seoKeywords ?? "");
  const [ogImage, setOgImage] = useState<string | null>(article?.ogImage ?? null);
  const [canonicalUrl, setCanonicalUrl] = useState(article?.canonicalUrl ?? "");

  const seoScore = useMemo(
    () =>
      computeSeoScore({
        headline,
        seoTitle: seoTitle || null,
        dek,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
        slug,
        coverImageUrl,
        bodyHtml,
      }).score,
    [headline, seoTitle, dek, seoDescription, seoKeywords, slug, coverImageUrl, bodyHtml]
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <p className="rounded-md border border-[var(--admin-danger-bg)] bg-[var(--admin-danger-bg)] px-3.5 py-2.5 text-[13px] text-[var(--admin-danger)]">
          {state.error}
        </p>
      )}

      {/* Hidden fields carrying non-native-input state */}
      <input type="hidden" name="body" value={bodyHtml} />
      <input type="hidden" name="coverImageUrl" value={coverImageUrl ?? ""} />
      <input type="hidden" name="ogImage" value={ogImage ?? ""} />
      <input type="hidden" name="isFeatured" value={isFeatured ? "true" : "false"} />
      <input type="hidden" name="isExclusive" value={isExclusive ? "true" : "false"} />
      {selectedSlugs.map((s) => (
        <input key={s} type="hidden" name="categorySlugs" value={s} />
      ))}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Input
              name="headline"
              value={headline}
              onChange={(e) => {
                setHeadline(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              maxLength={200}
              placeholder="Article headline"
              className="h-auto border-none px-0 text-2xl font-bold shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center gap-1.5 text-[13px] text-[var(--admin-fg-muted)]">
              <span>{siteUrl}/articles/</span>
              <input
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugTouched(true);
                }}
                required
                maxLength={100}
                className="min-w-0 flex-1 border-b border-dashed border-transparent bg-transparent font-mono text-[13px] text-[var(--admin-fg)] outline-none hover:border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
              />
            </div>
          </div>

          <div className="flex gap-1 border-b border-[var(--admin-border)]">
            {(["content", "engagement", "seo"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  tab === key ? "text-[var(--admin-fg)]" : "text-[var(--admin-fg-muted)] hover:text-[var(--admin-fg)]"
                }`}
              >
                {key === "content" ? "Content" : key === "engagement" ? "Engagement" : "SEO"}
                {key === "seo" && (
                  <Badge variant={seoScore >= 80 ? "success" : seoScore >= 50 ? "default" : "danger"} className="ml-0.5">
                    {seoScore}
                  </Badge>
                )}
                {tab === key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--admin-primary)]" />}
              </button>
            ))}
          </div>

          {/* Both tabs stay mounted (hidden, not unmounted) — every field
              needs to remain in the DOM for form submission no matter which
              tab is showing when Save is clicked, and it keeps the rich
              text editor's state/cursor from resetting on tab switches. */}
          <div className={tab === "content" ? "flex flex-col gap-5" : "hidden"}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dek">Excerpt</Label>
              <Textarea
                id="dek"
                name="dek"
                value={dek}
                onChange={(e) => setDek(e.target.value)}
                required
                maxLength={400}
                rows={2}
                placeholder="A one or two sentence summary — shown on cards and previews."
              />
            </div>

            <ImageField label="Featured image" value={coverImageUrl} onChange={setCoverImageUrl} />

            <div className="flex flex-col gap-1.5">
              <Label>Content</Label>
              <RichTextEditor content={bodyHtml} onChange={setBodyHtml} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="author">Author</Label>
              <Input id="author" name="author" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={100} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="#veterans, #florida, #investigation"
              />
              <p className="text-[11.5px] text-[var(--admin-fg-muted)]">
                Comma-separated. The # is optional — added automatically.
              </p>
            </div>
          </div>

          <div className={tab === "engagement" ? "flex flex-col gap-5" : "hidden"}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bulletPoints">Bottom line up front</Label>
              <Textarea
                id="bulletPoints"
                name="bulletPoints"
                value={bulletPoints}
                onChange={(e) => setBulletPoints(e.target.value)}
                rows={4}
                placeholder={"One point per line — up to 4.\nWhy this story matters.\nWhat changes because of it."}
              />
              <p className="text-[11.5px] text-[var(--admin-fg-muted)]">
                A punchy 2–4 bullet summary shown above the story. One point per line, up to 4. Leave blank to skip it.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 rounded-md border border-[var(--admin-border)] p-4">
              <span className="text-[13px] font-medium text-[var(--admin-fg)]">What They&rsquo;re Not Telling You</span>
              <p className="mb-1 text-[11.5px] text-[var(--admin-fg-muted)]">
                An optional callout contrasting mainstream coverage against this story&rsquo;s angle. Leave the title
                blank to skip it.
              </p>
              <Label htmlFor="comparisonTitle">Callout title</Label>
              <Input
                id="comparisonTitle"
                name="comparisonTitle"
                value={comparisonTitle}
                onChange={(e) => setComparisonTitle(e.target.value)}
                maxLength={120}
                placeholder="What the networks left out"
              />
              <Label htmlFor="comparisonBody" className="mt-2">
                Callout text
              </Label>
              <Textarea
                id="comparisonBody"
                name="comparisonBody"
                value={comparisonBody}
                onChange={(e) => setComparisonBody(e.target.value)}
                rows={3}
                maxLength={600}
                placeholder="How mainstream outlets framed this story, and what they missed."
              />
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="comparisonSourceLabel">Source label</Label>
                  <Input
                    id="comparisonSourceLabel"
                    name="comparisonSourceLabel"
                    value={comparisonSourceLabel}
                    onChange={(e) => setComparisonSourceLabel(e.target.value)}
                    maxLength={80}
                    placeholder="CNN, NYT coverage"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="comparisonSourceUrl">Source link</Label>
                  <Input
                    id="comparisonSourceUrl"
                    name="comparisonSourceUrl"
                    type="url"
                    value={comparisonSourceUrl}
                    onChange={(e) => setComparisonSourceUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={tab === "seo" ? "contents" : "hidden"}>
            <SeoPanel
              headline={headline}
              dek={dek}
              bodyHtml={bodyHtml}
              slug={slug}
              coverImageUrl={coverImageUrl}
              seoTitle={seoTitle}
              onSeoTitleChange={setSeoTitle}
              seoDescription={seoDescription}
              onSeoDescriptionChange={setSeoDescription}
              seoKeywords={seoKeywords}
              onSeoKeywordsChange={setSeoKeywords}
              ogImage={ogImage}
              onOgImageChange={setOgImage}
              canonicalUrl={canonicalUrl}
              onCanonicalUrlChange={setCanonicalUrl}
              siteUrl={siteUrl}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-[76px] lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="status" value={status} />
              </div>

              <div className="flex items-center justify-between rounded-md border border-[var(--admin-border)] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--admin-primary)]" />
                  <span className="text-[13px] font-medium text-[var(--admin-fg)]">Featured</span>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>

              <div className="flex items-center justify-between rounded-md border border-[var(--admin-border)] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[var(--admin-primary)]" />
                  <span className="text-[13px] font-medium text-[var(--admin-fg)]">Exclusive</span>
                </div>
                <Switch checked={isExclusive} onCheckedChange={setIsExclusive} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="publishedAt">Published date</Label>
                <Input
                  id="publishedAt"
                  name="publishedAt"
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
                <p className="text-[11.5px] text-[var(--admin-fg-muted)]">
                  Leave blank to stamp the moment this is published.
                </p>
                {isScheduled && (
                  <p className="rounded-md border border-[var(--admin-primary)]/30 bg-[var(--admin-primary)]/5 px-2.5 py-2 text-[11.5px] text-[var(--admin-primary)]">
                    Scheduled — this stays hidden from the site until{" "}
                    {new Date(publishedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    .
                  </p>
                )}
              </div>

              <Button type="submit" disabled={pending} className="w-full">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save changes" : status === "published" ? "Publish" : "Save draft"}
              </Button>

              {isEdit && article && (
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href={`/admin/articles/${article.id}/preview`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                    Preview
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryMultiSelect
                categories={categories}
                onCategoriesChange={setCategories}
                selectedSlugs={selectedSlugs}
                onSelectedChange={setSelectedSlugs}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
