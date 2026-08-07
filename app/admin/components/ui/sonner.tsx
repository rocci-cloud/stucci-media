"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-lg border border-[var(--admin-border)] bg-white text-[var(--admin-fg)] shadow-md",
          description: "text-[var(--admin-fg-muted)]",
          actionButton: "bg-[var(--admin-primary)] text-white",
          cancelButton: "bg-[var(--admin-bg-subtle)] text-[var(--admin-fg)]",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
