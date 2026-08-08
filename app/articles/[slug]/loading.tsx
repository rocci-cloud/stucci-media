export default function ArticleLoading() {
  return (
    <main className="animate-pulse">
      <div className="w-full h-[52svh] min-h-[380px] max-h-[520px] sm:h-[56vh] sm:max-h-[560px] bg-[#E5E4E0] border-b-4 border-[var(--color-navy)]" />
      <div className="mx-auto max-w-[1280px] px-5 pt-8 sm:pt-10 pb-18 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
        <article className="max-w-[720px]">
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
      </div>
    </main>
  );
}
