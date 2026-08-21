import Link from "next/link";
import { PERIODS } from "../../lib/analytics";

/**
 * Date-range control. Plain links rather than client state so the range is
 * in the URL: a particular view is shareable, bookmarkable, and survives a
 * refresh, and the page stays a server component that fetches once.
 */
export default function PeriodTabs({ active }: { active: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1">
      {Object.entries(PERIODS).map(([key, period]) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={`/admin/analytics?period=${key}`}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
              isActive
                ? "bg-[var(--admin-primary)] text-white"
                : "text-[var(--admin-fg-muted)] hover:bg-[var(--admin-bg-subtle)] hover:text-[var(--admin-fg)]"
            }`}
          >
            {period.label}
          </Link>
        );
      })}
    </div>
  );
}
