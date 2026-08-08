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
import type { Redirect } from "../../lib/redirects";
import type { RedirectActionResult } from "./actions";

// Next.js's App Router only actually issues two redirect behaviors under
// the hood (permanentRedirect() → 308, redirect() → 307) — no matter what
// status this dropdown showed, that's genuinely all that's achievable
// without dropping to a raw Route Handler and losing the real 404 page on
// a non-match. Offering 301/302 here would just be a label that lies
// about the real response, so the choice is limited to what's true.
const STATUS_CODES = [
  { value: "308", label: "308 — Permanent" },
  { value: "307", label: "307 — Temporary" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirect?: Redirect | null;
  onSubmit: (formData: FormData) => Promise<RedirectActionResult>;
  onSuccess: (redirect: Redirect) => void;
};

export default function RedirectDialog({ open, onOpenChange, redirect, onSubmit, onSuccess }: Props) {
  const isEdit = Boolean(redirect);
  const [fromPath, setFromPath] = useState(redirect?.fromPath ?? "");
  const [toPath, setToPath] = useState(redirect?.toPath ?? "");
  const [statusCode, setStatusCode] = useState(String(redirect?.statusCode ?? 308));
  const [isActive, setIsActive] = useState(redirect?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setFromPath(redirect?.fromPath ?? "");
      setToPath(redirect?.toPath ?? "");
      setStatusCode(String(redirect?.statusCode ?? 308));
      setIsActive(redirect?.isActive ?? true);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, redirect?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData();
    formData.set("fromPath", fromPath);
    formData.set("toPath", toPath);
    formData.set("statusCode", statusCode);
    formData.set("isActive", String(isActive));

    const result = await onSubmit(formData);
    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    onSuccess(result.redirect);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit redirect" : "New redirect"}</DialogTitle>
          <DialogDescription>
            A visitor hitting the old path is sent to the new one automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-md border border-[var(--admin-danger-bg)] bg-[var(--admin-danger-bg)] px-3 py-2 text-[13px] text-[var(--admin-danger)]">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="redirect-from">From path</Label>
            <Input
              id="redirect-from"
              value={fromPath}
              required
              autoFocus
              maxLength={500}
              onChange={(e) => setFromPath(e.target.value)}
              placeholder="/old-article-slug"
              className="font-mono text-[13px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="redirect-to">Destination</Label>
            <Input
              id="redirect-to"
              value={toPath}
              required
              maxLength={500}
              onChange={(e) => setToPath(e.target.value)}
              placeholder="/articles/new-slug or https://example.com"
              className="font-mono text-[13px]"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="redirect-status">Status code</Label>
              <Select value={statusCode} onValueChange={setStatusCode}>
                <SelectTrigger id="redirect-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_CODES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch id="redirect-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="redirect-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !fromPath.trim() || !toPath.trim()}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create redirect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
