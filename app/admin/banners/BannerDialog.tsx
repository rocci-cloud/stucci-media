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
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import ImageField from "../articles/ImageField";
import { BANNER_PLACEMENT_LABELS, type BannerPlacement } from "../../lib/banner-placements";
import type { Banner } from "../../lib/banners";
import type { BannerActionResult } from "./actions";

const PLACEMENTS = Object.keys(BANNER_PLACEMENT_LABELS) as BannerPlacement[];

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: Banner | null;
  defaultPlacement?: BannerPlacement;
  onSubmit: (formData: FormData) => Promise<BannerActionResult>;
  onSuccess: (banner: Banner) => void;
};

export default function BannerDialog({
  open,
  onOpenChange,
  banner,
  defaultPlacement,
  onSubmit,
  onSuccess,
}: Props) {
  const isEdit = Boolean(banner);
  const [name, setName] = useState(banner?.name ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(banner?.imageUrl ?? null);
  const [destinationUrl, setDestinationUrl] = useState(banner?.destinationUrl ?? "");
  const [placement, setPlacement] = useState<BannerPlacement>(
    banner?.placement ?? defaultPlacement ?? "HOMEPAGE"
  );
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [startDate, setStartDate] = useState(toLocalInputValue(banner?.startDate ?? null));
  const [endDate, setEndDate] = useState(toLocalInputValue(banner?.endDate ?? null));
  const [sortOrder, setSortOrder] = useState(String(banner?.sortOrder ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setName(banner?.name ?? "");
      setImageUrl(banner?.imageUrl ?? null);
      setDestinationUrl(banner?.destinationUrl ?? "");
      setPlacement(banner?.placement ?? defaultPlacement ?? "HOMEPAGE");
      setIsActive(banner?.isActive ?? true);
      setStartDate(toLocalInputValue(banner?.startDate ?? null));
      setEndDate(toLocalInputValue(banner?.endDate ?? null));
      setSortOrder(String(banner?.sortOrder ?? 0));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, banner?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!imageUrl) {
      setError("Upload a banner image before saving.");
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("imageUrl", imageUrl);
    formData.set("destinationUrl", destinationUrl);
    formData.set("placement", placement);
    formData.set("isActive", String(isActive));
    formData.set("startDate", startDate);
    formData.set("endDate", endDate);
    formData.set("sortOrder", sortOrder);

    const result = await onSubmit(formData);
    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    onSuccess(result.banner);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit banner" : "New banner"}</DialogTitle>
          <DialogDescription>
            Banners only render on the site while Active and (if set) within their date window.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-md border border-[var(--admin-danger-bg)] bg-[var(--admin-danger-bg)] px-3 py-2 text-[13px] text-[var(--admin-danger)]">
              {error}
            </p>
          )}

          <ImageField label="Banner image" value={imageUrl} onChange={setImageUrl} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="banner-name">Internal name (optional)</Label>
            <Input
              id="banner-name"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 subscriber drive"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="banner-destination">Destination URL</Label>
            <Input
              id="banner-destination"
              type="url"
              required
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="banner-placement">Placement</Label>
            <Select value={placement} onValueChange={(v) => setPlacement(v as BannerPlacement)}>
              <SelectTrigger id="banner-placement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACEMENTS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {BANNER_PLACEMENT_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banner-start">Start date (optional)</Label>
              <Input
                id="banner-start"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banner-end">End date (optional)</Label>
              <Input
                id="banner-end"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banner-order">Display order</Label>
              <Input
                id="banner-order"
                type="number"
                className="w-24"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <Switch id="banner-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="banner-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !destinationUrl.trim()}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create banner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
