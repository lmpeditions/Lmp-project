"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyRevenue } from "@/lib/types";

export function RevenueChart({
  data,
  labels,
}: {
  data: MonthlyRevenue[];
  labels: { collected: string; pending: string };
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v / 1000}k`}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 10,
            fontSize: 12,
            color: "hsl(var(--foreground))",
          }}
          formatter={(value: number, name: string) => [
            `${new Intl.NumberFormat("fr-MA").format(value)} DH`,
            name === "collected" ? labels.collected : labels.pending,
          ]}
        />
        <Bar dataKey="collected" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
        <Bar dataKey="pending" fill="hsl(var(--accent))" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
