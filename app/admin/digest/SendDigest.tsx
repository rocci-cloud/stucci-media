"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { sendDigestAction } from "./actions";

export default function SendDigest({
  configured,
  subscriberCount,
  defaultTestEmail,
}: {
  configured: boolean;
  subscriberCount: number;
  defaultTestEmail: string;
}) {
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function run(testTo?: string) {
    setBusy(true);
    startTransition(async () => {
      const result = await sendDigestAction(testTo);
      setBusy(false);
      setConfirmOpen(false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.test
          ? `Test digest sent to ${testTo}.`
          : `Digest sent to ${result.sent} subscriber${result.sent === 1 ? "" : "s"}${
              result.failed > 0 ? ` — ${result.failed} failed` : ""
            }.`
      );
    });
  }

  const disabled = !configured || busy || pending;

  return (
    <div className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
      <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--admin-fg)]">
        <Mail className="h-4 w-4" />
        Send this digest
      </h3>

      <div className="mt-3 flex flex-col gap-1.5">
        <Label htmlFor="digest-test-email">Send a test to</Label>
        <Input
          id="digest-test-email"
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={disabled}
        />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={() => run(testEmail.trim())}
          disabled={disabled || !testEmail.trim()}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Send test
        </Button>
        <Button onClick={() => setConfirmOpen(true)} disabled={disabled || subscriberCount === 0}>
          <Send className="h-4 w-4" />
          Send to all {subscriberCount}
        </Button>
      </div>

      <p className="mt-2 text-[12px] leading-[1.5] text-[var(--admin-fg-muted)]">
        {configured
          ? "Send a test to yourself first — a digest can't be recalled once it goes out."
          : "Set RESEND_API_KEY and EMAIL_FROM to enable sending."}
      </p>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Send to all {subscriberCount} subscriber{subscriberCount === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This sends the digest exactly as previewed. It goes out immediately and can&apos;t be
              recalled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => run()} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Send now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
