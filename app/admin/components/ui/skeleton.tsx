import { cn } from "../../lib/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[var(--admin-bg-subtle)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
