"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney, formatMonthShortTh } from "@/lib/format";
import type { MonthlyTrendPoint } from "@/server/queries/dashboard";

const config = {
  total: {
    label: "รายจ่าย",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function TrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  const chartData = data.map((d) => ({
    label: formatMonthShortTh(d.month),
    total: d.total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>แนวโน้มรายจ่าย 6 เดือน</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[240px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatMoney(Number(value))}
                />
              }
            />
            <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
