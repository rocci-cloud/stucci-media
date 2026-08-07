"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import ImageField from "./ImageField";
import { computeSeoScore, type SeoCheck } from "../../lib/seo-score";

type Props = {
  headline: string;
  dek: string;
  bodyHtml: string;
  slug: string;
  coverImageUrl: string | null;
  seoTitle: string;
  onSeoTitleChange: (v: string) => void;
  seoDescription: string;
  onSeoDescriptionChange: (v: string) => void;
  seoKeywords: string;
  onSeoKeywordsChange: (v: string) => void;
  ogImage: string | null;
  onOgImageChange: (url: string | null) => void;
  canonicalUrl: string;
  onCanonicalUrlChange: (v: string) => void;
  siteUrl: string;
};

function scoreColor(score: number) {
  if (score >= 80) return "var(--admin-success)";
  if (score >= 50) return "#d97706";
  return "var(--admin-danger)";
}

function CheckIcon({ status }: { status: SeoCheck["status"] }) {
  if (status === "good") return <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--admin-success)]" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />;
  return <XCircle className="h-4 w-4 shrink-0 text-[var(--admin-danger)]" />;
}

export default function SeoPanel(props: Props) {
  const { score, checks } = computeSeoScore({
    headline: props.headline,
    seoTitle: props.seoTitle || null,
    dek: props.dek,
    seoDescription: props.seoDescription || null,
    seoKeywords: props.seoKeywords || null,
    slug: props.slug,
    coverImageUrl: props.coverImageUrl,
    bodyHtml: props.bodyHtml,
  });

  const displayTitle = props.seoTitle || props.headline || "Untitled article";
  const displayDescription = props.seoDescription || props.dek || "No description yet.";
  const displayUrl = `${props.siteUrl}/articles/${props.slug || "your-article-slug"}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg-subtle)]/50 p-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ backgroundColor: scoreColor(score) }}
        >
          {score}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--admin-fg)]">SEO Score</p>
          <p className="text-[12.5px] text-[var(--admin-fg-muted)]">
            {score >= 80 ? "Great — this article is well optimized." : score >= 50 ? "Decent — a few things to improve." : "Needs work before publishing."}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2">
            <CheckIcon status={check.status} />
            <div>
              <span className="text-[13px] font-medium text-[var(--admin-fg)]">{check.label}</span>
              <p className="text-[12.5px] text-[var(--admin-fg-muted)]">{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1.5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--admin-fg-muted)]">
          Google preview
        </p>
        <div className="rounded-md border border-[var(--admin-border)] bg-white p-3.5 font-sans">
          <p className="truncate text-[13px] text-[#202124]">{displayUrl}</p>
          <p className="truncate text-[19px] text-[#1a0dab]">{displayTitle}</p>
          <p className="line-clamp-2 text-[13.5px] text-[#4d5156]">{displayDescription}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="seo-title">SEO title</Label>
          <span className="text-[11px] text-[var(--admin-fg-muted)]">{props.seoTitle.length}/60</span>
        </div>
        <Input
          id="seo-title"
          name="seoTitle"
          value={props.seoTitle}
          onChange={(e) => props.onSeoTitleChange(e.target.value)}
          placeholder={props.headline || "Defaults to the headline"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="seo-description">Meta description</Label>
          <span className="text-[11px] text-[var(--admin-fg-muted)]">{props.seoDescription.length}/160</span>
        </div>
        <Textarea
          id="seo-description"
          name="seoDescription"
          value={props.seoDescription}
          onChange={(e) => props.onSeoDescriptionChange(e.target.value)}
          rows={3}
          placeholder={props.dek || "Defaults to the dek"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seo-keywords">Focus keywords</Label>
        <Input
          id="seo-keywords"
          name="seoKeywords"
          value={props.seoKeywords}
          onChange={(e) => props.onSeoKeywordsChange(e.target.value)}
          placeholder="e.g. veteran owned business, comma-separated"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="canonical-url">Canonical URL</Label>
        <Input
          id="canonical-url"
          name="canonicalUrl"
          value={props.canonicalUrl}
          onChange={(e) => props.onCanonicalUrlChange(e.target.value)}
          placeholder={displayUrl}
        />
      </div>

      <ImageField label="OG image (social share)" value={props.ogImage} onChange={props.onOgImageChange} />
    </div>
  );
}
