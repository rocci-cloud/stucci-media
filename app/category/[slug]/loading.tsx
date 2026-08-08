export default function CategoryLoading() {
  return (
    <div className="animate-pulse">
      <div className="border-b-4 border-[var(--color-navy)] bg-[var(--color-bg-off)]">
        <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-6 sm:pt-10 sm:pb-7">
          <div className="h-4 w-20 bg-[#E5E4E0] rounded mb-3" />
          <div className="h-10 w-72 bg-[#E5E4E0] rounded" />
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-5 pt-8 sm:pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-4 sm:gap-6">
          <div className="aspect-[2/1] sm:aspect-[16/9] w-full bg-[#E5E4E0] rounded-card" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[60px] w-full bg-[#E5E4E0] rounded-card" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[60px] w-full bg-[#E5E4E0] rounded-card" />
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
