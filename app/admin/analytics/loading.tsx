import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

/** Shaped to match the real page so the layout does not jump on arrival. */
export default function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-2 h-3 w-64" />
        </div>
        <Skeleton className="h-10 w-[380px] max-w-full" />
      </div>

      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-10 w-56" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-7 w-16" />
              <Skeleton className="mt-2 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-4 h-[260px] w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-40" />
              <div className="mt-4 flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-8 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
