export default function BreakingBar() {
  return (
    <div className="bg-[var(--color-black)]">
      <div className="mx-auto max-w-[1200px] px-5 py-[9px] flex items-center gap-2.5 text-[13px] font-sans">
        <span className="bg-[var(--color-red)] text-white font-bold text-[11px] tracking-wide uppercase px-2 py-[3px] rounded-sm shrink-0">
          Breaking
        </span>
        <span className="text-white">
          Car Surveillance Mandate 2027 draws bipartisan pushback —{" "}
          <a href="/articles/car-surveillance-mandate-2027" className="hover:underline">
            full report →
          </a>
        </span>
      </div>
    </div>
  );
}
