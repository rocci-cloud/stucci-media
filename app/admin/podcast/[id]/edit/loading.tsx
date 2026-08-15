import { Skeleton } from "../../../components/ui/skeleton";

export default function EditEpisodeLoading() {
  return (
    <div className="max-w-[1100px]">
      <Skeleton className="mb-6 h-6 w-40" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-[420px] w-full rounded-md" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
