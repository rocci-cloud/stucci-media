import { Skeleton } from "../components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-8 w-24" />
      </div>
      {Array.from({ length: 2 }).map((_, card) => (
        <div key={card} className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <Skeleton className="mb-4 h-4 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-[var(--admin-border)] py-3 last:border-0">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-8 w-36" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
