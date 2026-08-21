import Link from "next/link";

export type RankedItem = {
  label: string;
  value: number;
  /** Optional second figure shown to the right of the count. */
  meta?: string;
  href?: string;
};

/**
 * A ranked list of magnitudes, drawn as plain HTML rather than a chart.
 *
 * These lists are all "label plus a number, in order". A bar chart of them
 * would spend its width on an axis nobody reads and would collide long
 * labels; a row per item direct-labels every value, wraps predictably on a
 * phone, and is readable by a screen reader without a table view bolted on.
 * The bar behind each row is a proportion cue, not the thing being read.
 */
export default function RankedBars({
  items,
  emptyMessage = "Nothing recorded yet.",
  total,
}: {
  items: RankedItem[];
  emptyMessage?: string;
  /** Denominator for the bar widths. Defaults to the largest value. */
  total?: number;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-[12px] text-[var(--admin-fg-muted)]">{emptyMessage}</p>;
  }

  const max = total ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => {
        const pct = max > 0 ? Math.max(2, Math.round((item.value / max) * 100)) : 0;
        const label = item.href ? (
          <Link href={item.href} className="truncate hover:underline" title={item.label}>
            {item.label}
          </Link>
        ) : (
          <span className="truncate" title={item.label}>
            {item.label}
          </span>
        );

        return (
          <li key={item.label} className="relative flex items-center gap-3 rounded-md px-2 py-1.5">
            {/* Proportion cue only — the number to its right is the datum. */}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-md"
              style={{ width: `${pct}%`, background: "var(--admin-chart-2-soft)" }}
            />
            <span className="relative min-w-0 flex-1 text-[13px] text-[var(--admin-fg)]">{label}</span>
            {item.meta && (
              <span className="relative shrink-0 text-[12px] tabular-nums text-[var(--admin-fg-muted)]">
                {item.meta}
              </span>
            )}
            <span className="relative shrink-0 text-[13px] font-semibold tabular-nums text-[var(--admin-fg)]">
              {item.value.toLocaleString()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
