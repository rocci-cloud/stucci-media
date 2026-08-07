import * as React from "react";
import { cn } from "../../lib/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-[var(--admin-border)] bg-white px-3 py-1 text-sm text-[var(--admin-fg)] shadow-xs transition-colors placeholder:text-[var(--admin-fg-muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ring)] focus-visible:border-[var(--admin-primary)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
