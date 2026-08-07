import { Card, CardContent } from "./components/ui/card";
import { Skeleton } from "./components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 p-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <ul className="divide-y divide-[var(--admin-border)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="border-b border-[var(--admin-border)] px-5 py-4">
            <Skeleton className="h-4 w-28" />
          </div>
          <ul className="divide-y divide-[var(--admin-border)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3">
                <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
