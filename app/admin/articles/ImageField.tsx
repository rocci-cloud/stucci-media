"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { ImageOff, Loader2, Upload, X } from "lucide-react";
import { Button } from "../components/ui/button";

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
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/admin/upload" });
      onChange(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-[var(--admin-fg)]">{label}</span>

      {value ? (
        <div className="group relative overflow-hidden rounded-md border border-[var(--admin-border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="aspect-video w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button type="button" size="sm" variant="secondary" asChild disabled={uploading}>
              <label className="cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Replace
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
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
          <span className="text-[13px] font-medium">{uploading ? "Uploading…" : "Upload image"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}

      {error && <p className="text-[12px] text-[var(--admin-danger)]">{error}</p>}
    </div>
  );
}
