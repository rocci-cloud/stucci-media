import * as React from "react";
import { cn } from "../../lib/cn";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-xs",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 p-5", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-sm font-semibold text-[var(--admin-fg)]", className)} {...props} />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-[13px] text-[var(--admin-fg-muted)]", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
