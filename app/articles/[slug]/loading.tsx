export default function ArticleLoading() {
  return (
    <main className="mx-auto max-w-[1280px] px-5 pt-8 pb-18 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10 animate-pulse">
      <article className="max-w-[720px]">
        <div className="h-4 w-24 bg-[#E5E4E0] rounded mb-4" />
        <div className="h-5 w-20 bg-[#E5E4E0] rounded mb-3" />
        <div className="h-9 w-full bg-[#E5E4E0] rounded mb-2" />
        <div className="h-9 w-3/4 bg-[#E5E4E0] rounded mb-4" />
        <div className="h-10 w-full bg-[#E5E4E0] rounded mb-7" />
        <div className="w-full aspect-video bg-[#E5E4E0] rounded-card mb-7" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full bg-[#E5E4E0] rounded" />
          ))}
        </div>
      </article>
      <div className="mt-10 lg:mt-0 flex flex-col gap-4">
        <div className="h-64 w-full bg-[#E5E4E0] rounded-card" />
        <div className="h-40 w-full bg-[#E5E4E0] rounded-card" />
      </div>
    </main>
  );
}
