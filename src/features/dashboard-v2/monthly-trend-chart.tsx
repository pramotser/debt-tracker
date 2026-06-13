"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

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

export function MonthlyTrendChart({ data }: { data: MonthTotal[] }) {
  const chartData = data.map((d) => ({
    label: formatMonthShortTh(d.month),
    ym: formatYearMonth(d.year, d.month),
    total: d.total,
  }));
  const hasAny = chartData.some((d) => d.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          แนวโน้ม 6 เดือนย้อนหลัง
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAny ? (
          <ChartContainer config={config} className="h-[220px] w-full">
            <LineChart data={chartData} margin={{ left: 4, right: 12 }}>
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
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            ยังไม่มีรายการใน 6 เดือนที่ผ่านมา
          </div>
        )}
      </CardContent>
    </Card>
  );
}
