"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { AudioLines, Loader2, Upload, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const ALLOWED_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
]);

/**
 * Reads an audio file's duration in the browser before upload, so the
 * episode's duration field fills itself in. Best effort — a codec the
 * browser can't decode simply leaves the field for a human to type.
 */
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.addEventListener("loadedmetadata", () =>
      done(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null)
    );
    audio.addEventListener("error", () => done(null));
    audio.src = url;
  });
}

export default function AudioField({
  value,
  onChange,
  onDurationDetected,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  onDurationDetected?: (seconds: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Use an MP3, M4A, WAV, OGG, or WebM file.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const duration = await readDuration(file);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        // Tells the upload route to use the audio allowlist and size cap
        // rather than the image ones.
        clientPayload: "audio",
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      onChange(blob.url);
      if (duration !== null) onDurationDetected?.(duration);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Audio</Label>
        <button
          type="button"
          onClick={() => setManual((v) => !v)}
          className="text-[12px] font-medium text-[var(--admin-primary)] hover:underline"
        >
          {manual ? "Upload a file instead" : "Paste a URL instead"}
        </button>
      </div>

      {manual ? (
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.trim() || null)}
          placeholder="https://… (an episode already hosted elsewhere)"
        />
      ) : value ? (
        <div className="flex flex-col gap-2 rounded-md border border-[var(--admin-border)] p-3">
          <div className="flex items-center gap-2">
            <AudioLines className="h-4 w-4 shrink-0 text-[var(--admin-primary)]" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--admin-fg-muted)]">{value}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)} aria-label="Remove audio">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio src={value} controls preload="metadata" className="w-full" />
        </div>
      ) : (
        <label className="flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--admin-border)] bg-[var(--admin-bg-subtle)]/50 text-[var(--admin-fg-muted)] transition-colors hover:border-[var(--admin-primary)] hover:text-[var(--admin-primary)]">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-[13px] font-medium">
            {uploading ? `Uploading ${progress}%` : "Upload episode audio"}
          </span>
          <span className="text-[11.5px]">MP3, M4A, WAV, OGG, or WebM</span>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      )}

      {error && <p className="text-[12px] text-[var(--admin-danger)]">{error}</p>}
    </div>
  );
}
