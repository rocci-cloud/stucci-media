"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PublishingDay } from "../../lib/dashboard";

/**
 * Publishing volume over the last month — how much went out, not how much
 * was read. Traffic now has a real per-day series of its own behind it
 * (page_views, see lib/analytics.ts) and is charted on /admin/analytics;
 * this chart deliberately stays a volume chart so the two answer different
 * questions rather than one being a worse copy of the other.
 */
export default function PublishingChart({ data }: { data: PublishingDay[] }) {
  const total = data.reduce((sum, d) => sum + d.published, 0);

  if (total === 0) {
    return (
      <div className="flex h-[180px] flex-col items-center justify-center gap-1 text-center">
        <p className="text-[13px] font-medium text-[var(--admin-fg)]">Nothing published in the last 30 days</p>
        <p className="text-[12px] text-[var(--admin-fg-muted)]">This fills in as stories go live.</p>
      </div>
    );
  }

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="publishFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--admin-primary)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--admin-primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--admin-fg-muted)" }}
            tickLine={false}
            axisLine={false}
            // A tick per day is unreadable at this width; every fifth is
            // enough to orient the eye.
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--admin-fg-muted)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "var(--admin-border)" }}
            contentStyle={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--admin-fg)",
            }}
            formatter={(value) => [`${Number(value ?? 0)} published`, ""]}
          />
          <Area
            type="monotone"
            dataKey="published"
            stroke="var(--admin-primary)"
            strokeWidth={2}
            fill="url(#publishFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
