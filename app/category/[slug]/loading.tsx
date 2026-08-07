export default function CategoryLoading() {
  return (
    <div className="animate-pulse">
      <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-4 border-b-4 border-[var(--color-navy)]">
        <div className="h-8 w-64 bg-[#E5E4E0] rounded" />
      </div>
      <div className="mx-auto max-w-[1280px] px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-video w-full bg-[#E5E4E0] rounded-card" />
              <div className="h-4 w-1/3 bg-[#E5E4E0] rounded" />
              <div className="h-5 w-full bg-[#E5E4E0] rounded" />
              <div className="h-4 w-2/3 bg-[#E5E4E0] rounded" />
            </div>
          ))}
        </div>
        <div className="mt-10 lg:mt-0 flex flex-col gap-4">
          <div className="h-64 w-full bg-[#E5E4E0] rounded-card" />
          <div className="h-40 w-full bg-[#E5E4E0] rounded-card" />
        </div>
      </div>
    </div>
  );
}
