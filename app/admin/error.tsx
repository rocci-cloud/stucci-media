"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-danger-bg)] text-[var(--admin-danger)]">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[var(--admin-fg)]">Something went wrong</p>
        <p className="max-w-sm text-[13px] text-[var(--admin-fg-muted)]">
          This section couldn&apos;t load. This is usually temporary — try again in a moment.
        </p>
      </div>
      <Button size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
