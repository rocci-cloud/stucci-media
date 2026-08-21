"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrafficPoint } from "../../lib/analytics";

/**
 * Page views and visitors over time.
 *
 * Both series are counts of the same kind of thing on the same scale, so
 * they share one y-axis. A second axis would let the two lines cross
 * wherever the scales happened to put them and imply relationships that
 * are not in the data.
 *
 * Series colours come from --admin-chart-1/2, assigned to the entity
 * rather than to rank, and both are direct-labelled in the legend so
 * identity never rests on colour alone.
 */
export default function TrafficChart({ data, days }: { data: TrafficPoint[]; days: number }) {
  const total = data.reduce((sum, d) => sum + d.views, 0);

  if (total === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-1 text-center">
        <p className="text-[13px] font-medium text-[var(--admin-fg)]">No traffic recorded yet</p>
        <p className="max-w-xs text-[12px] text-[var(--admin-fg-muted)]">
          This fills in as people visit the site. Data starts from the day analytics went live, not before.
        </p>
      </div>
    );
  }

  // A tick per day is unreadable past a couple of weeks.
  const interval = days <= 7 ? 0 : days <= 30 ? 4 : Math.floor(days / 8);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--admin-chart-1)" stopOpacity={0.26} />
              <stop offset="100%" stopColor="var(--admin-chart-1)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--admin-chart-2)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--admin-chart-2)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--admin-fg-muted)" }}
            tickLine={false}
            axisLine={false}
            interval={interval}
            minTickGap={8}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--admin-fg-muted)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: "var(--admin-fg-muted)", strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--admin-fg)",
              boxShadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
            }}
            labelStyle={{ color: "var(--admin-fg)", fontWeight: 600, marginBottom: 2 }}
            itemStyle={{ color: "var(--admin-fg-muted)" }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, color: "var(--admin-fg-muted)" }}
          />
          <Area
            type="monotone"
            name="Page views"
            dataKey="views"
            stroke="var(--admin-chart-1)"
            strokeWidth={2}
            fill="url(#viewsFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--admin-surface)" }}
          />
          <Area
            type="monotone"
            name="Visitors"
            dataKey="visitors"
            stroke="var(--admin-chart-2)"
            strokeWidth={2}
            fill="url(#visitorsFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--admin-surface)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
