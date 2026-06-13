"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney, formatMonthShortTh, formatYearMonth } from "@/lib/format";
import type { MonthTotal } from "@/server/queries/dashboard-v2";

const config = {
  total: {
    label: "ยอดรวม",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function UpcomingBarsChart({ data }: { data: MonthTotal[] }) {
  const hasAny = data.some((d) => d.total > 0);
  const chartData = data.map((d) => ({
    label: formatMonthShortTh(d.month),
    ym: formatYearMonth(d.year, d.month),
    total: d.total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">เดือนข้างหน้า 6 เดือน</CardTitle>
      </CardHeader>
      <CardContent>
        {hasAny ? (
          <ChartContainer config={config} className="h-[220px] w-full">
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
                width={48}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_label, payload) =>
                      payload?.[0]?.payload?.ym ?? ""
                    }
                    formatter={(value) => formatMoney(Number(value))}
                  />
                }
              />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            ยังไม่มีรายการล่วงหน้าใน 6 เดือนข้างหน้า
          </div>
        )}
      </CardContent>
    </Card>
  );
}
