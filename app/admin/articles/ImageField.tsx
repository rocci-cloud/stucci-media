"use client";

import { useState } from "react";
import { ImageOff, Images, Loader2, Upload, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { uploadImage } from "./upload-image";
import MediaPickerDialog from "./MediaPickerDialog";

export default function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      // Validation, compression, the Blob client upload, and media-library
      // indexing all live in the shared helper — this field and the
      // editor's inline insert must not drift apart on any of them.
      const uploaded = await uploadImage(file, { onProgress: setProgress });
      onChange(uploaded.url);
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
        <span className="text-[13px] font-medium text-[var(--admin-fg)]">{label}</span>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1 text-[12px] font-medium text-[var(--admin-primary)] hover:underline"
        >
          <Images className="h-3.5 w-3.5" />
          Media library
        </button>
      </div>

      {value ? (
        <div className="group relative overflow-hidden rounded-md border border-[var(--admin-border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="aspect-video w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button type="button" size="sm" variant="secondary" asChild disabled={uploading}>
              <label className="cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Replace
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  className="hidden"
                  onChange={handleFile}
                  disabled={uploading}
                />
              </label>
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => onChange(null)}>
              <X className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--admin-border)] bg-[var(--admin-bg-subtle)]/50 text-[var(--admin-fg-muted)] transition-colors hover:border-[var(--admin-primary)] hover:text-[var(--admin-primary)]">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageOff className="h-5 w-5" />}
          <span className="text-[13px] font-medium">
            {uploading ? `Uploading ${progress}%` : "Upload image"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      )}

      {error && <p className="text-[12px] text-[var(--admin-danger)]">{error}</p>}

      <MediaPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={(image) => onChange(image.url)} />
    </div>
  );
}
