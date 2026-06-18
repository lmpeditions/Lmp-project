"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslations } from "next-intl";
import type { StageDistribution } from "@/lib/types";

const COLORS = [
  "hsl(248 70% 58%)",
  "hsl(262 65% 60%)",
  "hsl(210 90% 56%)",
  "hsl(190 80% 48%)",
  "hsl(152 60% 45%)",
  "hsl(32 95% 55%)",
  "hsl(14 85% 58%)",
  "hsl(340 75% 58%)",
];

export function StageChart({ data }: { data: StageDistribution[] }) {
  const tStages = useTranslations("stages");
  const chartData = data.map((d) => ({ ...d, label: tStages(d.stage) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 12 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={88}
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
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
        />
        <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={18}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
