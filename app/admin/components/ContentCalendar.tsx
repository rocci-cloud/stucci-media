"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import type { CalendarEntry } from "../../lib/dashboard";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A month grid of what shipped and what's queued. Scheduled stories (a
 * future publishedAt) are the reason this exists — seeing next week's
 * lineup is the whole point of a calendar in a newsroom tool.
 */
export default function ContentCalendar({ entries }: { entries: CalendarEntry[] }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const { cells, label, todayKey } = useMemo(() => {
    const now = new Date();
    const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1));
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();

    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const out: ({ date: Date; key: string } | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(Date.UTC(year, month, day));
      out.push({ date, key: toKey(date) });
    }

    return {
      cells: out,
      label: cursor.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
      todayKey: toKey(new Date()),
    };
  }, [monthOffset]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [entries]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[var(--admin-fg)]">{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonthOffset((v) => v - 1)}
            className="flex h-7 w-7 items-center justify-center rounded text-[var(--admin-fg-muted)] transition-colors hover:bg-[var(--admin-bg-subtle)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset(0)}
            className="rounded px-2 py-1 text-[11.5px] font-medium text-[var(--admin-fg-muted)] transition-colors hover:bg-[var(--admin-bg-subtle)]"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonthOffset((v) => v + 1)}
            className="flex h-7 w-7 items-center justify-center rounded text-[var(--admin-fg-muted)] transition-colors hover:bg-[var(--admin-bg-subtle)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, i) => (
          <div
            key={i}
            className="pb-1 text-center text-[10.5px] font-semibold tracking-wide text-[var(--admin-fg-muted)] uppercase"
          >
            {day}
          </div>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <div key={`pad-${i}`} />;
          const dayEntries = byDate.get(cell.key) ?? [];
          const scheduled = dayEntries.filter((e) => e.status === "scheduled").length;
          const published = dayEntries.length - scheduled;
          const isToday = cell.key === todayKey;

          return (
            <div
              key={cell.key}
              title={dayEntries.map((e) => e.headline).join("\n") || undefined}
              className={cn(
                "flex min-h-[42px] flex-col items-center gap-1 rounded border px-1 py-1",
                isToday
                  ? "border-[var(--admin-primary)] bg-[var(--admin-primary)]/5"
                  : "border-transparent hover:bg-[var(--admin-bg-subtle)]"
              )}
            >
              <span
                className={cn(
                  "text-[11.5px] tabular-nums",
                  isToday ? "font-bold text-[var(--admin-primary)]" : "text-[var(--admin-fg-muted)]"
                )}
              >
                {cell.date.getUTCDate()}
              </span>
              {dayEntries.length > 0 && (
                <span className="flex flex-wrap justify-center gap-0.5">
                  {published > 0 && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[var(--admin-success)]"
                      aria-label={`${published} published`}
                    />
                  )}
                  {scheduled > 0 && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[var(--admin-primary)]"
                      aria-label={`${scheduled} scheduled`}
                    />
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[11.5px] text-[var(--admin-fg-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--admin-success)]" />
          Published
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--admin-primary)]" />
          Scheduled
        </span>
        <Link href="/admin/articles" className="ml-auto font-medium text-[var(--admin-primary)] hover:underline">
          All articles →
        </Link>
      </div>
    </div>
  );
}
