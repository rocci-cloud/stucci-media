import { Skeleton } from "../components/ui/skeleton";

export default function TrashLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-72" />
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[var(--admin-border)] py-3 last:border-0">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-5 w-20 sm:block" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
