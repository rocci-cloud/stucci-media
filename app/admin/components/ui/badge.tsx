import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--admin-bg-subtle)] text-[var(--admin-fg)]",
        primary: "border-transparent bg-[var(--admin-primary)] text-white",
        success: "border-transparent bg-[var(--admin-success-bg)] text-[var(--admin-success)]",
        danger: "border-transparent bg-[var(--admin-danger-bg)] text-[var(--admin-danger)]",
        outline: "border-[var(--admin-border)] text-[var(--admin-fg-muted)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
