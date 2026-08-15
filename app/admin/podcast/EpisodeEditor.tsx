"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import RichTextEditor from "../articles/RichTextEditor";
import ImageField from "../articles/ImageField";
import AudioField from "./AudioField";
import { slugify } from "../../lib/slugify";
import { ARTICLE_STATUS_LABELS, type ArticleStatusValue } from "../../lib/articles";
import { formatDuration, type PodcastEpisode } from "../../lib/podcast";
import type { EpisodeFormState } from "./actions";

const AUTHOR_STATUSES: ArticleStatusValue[] = ["draft", "in_review"];
const PUBLISHER_STATUSES: ArticleStatusValue[] = ["draft", "in_review", "published", "archived"];

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EpisodeEditor({
  episode,
  action,
  canPublish,
}: {
  episode?: PodcastEpisode;
  action: (prev: EpisodeFormState, formData: FormData) => Promise<EpisodeFormState>;
  canPublish: boolean;
}) {
  const isEdit = Boolean(episode);
  const [state, formAction, pending] = useActionState(action, {});
  const [tab, setTab] = useState<"notes" | "transcript">("notes");

  const [title, setTitle] = useState(episode?.title ?? "");
  const [slug, setSlug] = useState(episode?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(episode));
  const [subtitle, setSubtitle] = useState(episode?.subtitle ?? "");
  const [showNotes, setShowNotes] = useState(episode?.showNotes ?? "");
  const [transcript, setTranscript] = useState(
    // Stored as HTML paragraphs; the textarea edits it as plain text, so
    // it's unwrapped here and re-wrapped on save by bodyInputToHtml.
    (episode?.transcript ?? "")
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<\/?p>/gi, "")
      .trim()
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(episode?.audioUrl ?? null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(episode?.coverImageUrl ?? null);
  const [duration, setDuration] = useState(
    episode?.durationSeconds ? formatDuration(episode.durationSeconds) : ""
  );
  const [status, setStatus] = useState<ArticleStatusValue>(episode?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(toLocalInputValue(episode?.publishedAt ?? null));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <p className="rounded-md border border-[var(--admin-danger-bg)] bg-[var(--admin-danger-bg)] px-3.5 py-2.5 text-[13px] text-[var(--admin-danger)]">
          {state.error}
        </p>
      )}

      <input type="hidden" name="showNotes" value={showNotes} />
      <input type="hidden" name="audioUrl" value={audioUrl ?? ""} />
      <input type="hidden" name="coverImageUrl" value={coverImageUrl ?? ""} />
      <input type="hidden" name="status" value={status} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Input
              name="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              maxLength={200}
              placeholder="Episode title"
              className="h-auto border-none px-0 text-2xl font-bold shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center gap-1.5 text-[13px] text-[var(--admin-fg-muted)]">
              <span>/podcast/</span>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              name="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              maxLength={300}
              placeholder="One line on what this episode covers."
            />
          </div>

          <AudioField
            value={audioUrl}
            onChange={setAudioUrl}
            onDurationDetected={(seconds) => setDuration(formatDuration(seconds))}
          />

          <div className="flex gap-1 border-b border-[var(--admin-border)]">
            {(["notes", "transcript"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`relative px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  tab === key ? "text-[var(--admin-fg)]" : "text-[var(--admin-fg-muted)] hover:text-[var(--admin-fg)]"
                }`}
              >
                {key === "notes" ? "Show notes" : "Transcript"}
                {tab === key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--admin-primary)]" />}
              </button>
            ))}
          </div>

          {/* Both stay mounted so the transcript textarea's value is always
              in the form, whichever tab is open when Save is pressed —
              same reasoning as the article editor's tabs. */}
          <div className={tab === "notes" ? "flex flex-col gap-1.5" : "hidden"}>
            <RichTextEditor content={showNotes} onChange={setShowNotes} />
          </div>

          <div className={tab === "transcript" ? "flex flex-col gap-1.5" : "hidden"}>
            <Textarea
              name="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={20}
              placeholder="Paste the transcript here. A blank line between paragraphs is all the formatting it needs."
              className="font-mono text-[13px]"
            />
            <p className="text-[11.5px] text-[var(--admin-fg-muted)]">
              {transcript.trim() ? `${transcript.trim().split(/\s+/).length.toLocaleString()} words` : "No transcript yet."}
            </p>
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
                <Select value={status} onValueChange={(v) => setStatus(v as ArticleStatusValue)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(canPublish ? PUBLISHER_STATUSES : AUTHOR_STATUSES).map((value) => (
                      <SelectItem key={value} value={value}>
                        {ARTICLE_STATUS_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="publishedAt">Release date</Label>
                <Input
                  id="publishedAt"
                  name="publishedAt"
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={pending} className="w-full">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save changes" : "Create episode"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Episode details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="episodeNumber">Episode #</Label>
                  <Input
                    id="episodeNumber"
                    name="episodeNumber"
                    type="number"
                    min={0}
                    defaultValue={episode?.episodeNumber ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="seasonNumber">Season</Label>
                  <Input
                    id="seasonNumber"
                    name="seasonNumber"
                    type="number"
                    min={0}
                    defaultValue={episode?.seasonNumber ?? ""}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  name="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="48:10"
                />
                <p className="text-[11.5px] text-[var(--admin-fg-muted)]">
                  mm:ss or h:mm:ss. Filled in automatically when you upload audio.
                </p>
              </div>

              <ImageField label="Episode art" value={coverImageUrl} onChange={setCoverImageUrl} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="guestName">Name</Label>
                <Input id="guestName" name="guestName" defaultValue={episode?.guestName ?? ""} maxLength={120} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="guestBio">Bio</Label>
                <Textarea id="guestBio" name="guestBio" defaultValue={episode?.guestBio ?? ""} rows={4} maxLength={600} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
