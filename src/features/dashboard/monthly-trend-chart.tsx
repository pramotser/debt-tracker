"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney, formatMonthShortTh, formatYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MonthTotal } from "@/server/queries/dashboard";

const config = {
  total: {
    label: "ยอดรวม",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

// แนวโน้มตลอดช่วง = (เดือนล่าสุด − เดือนแรกสุด) / เดือนแรกสุด × 100
// null ถ้า <2 เดือน หรือเดือนแรกสุด = 0 (หารไม่ได้)
function computeTrendPct(data: MonthTotal[]): number | null {
  if (data.length < 2) return null;
  const first = data[0].total;
  const last = data[data.length - 1].total;
  if (first === 0) return null;
  return Math.round(((last - first) / first) * 100);
}

export function MonthlyTrendChart({ data }: { data: MonthTotal[] }) {
  const chartData = data.map((d) => ({
    label: formatMonthShortTh(d.month),
    ym: formatYearMonth(d.year, d.month),
    total: d.total,
  }));
  const hasAny = chartData.some((d) => d.total > 0);
  const trend = computeTrendPct(data);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">แนวโน้ม 6 เดือนย้อนหลัง</CardTitle>
        {trend !== null && (
          <span
            title="เทียบเดือนแรกสุดกับล่าสุดในช่วง 6 เดือน"
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
              // แนวโน้มขึ้น = แดง · ลง = เขียว (เหมือน insight เดือนนี้)
              trend > 0 &&
                "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
              trend < 0 &&
                "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
              trend === 0 && "bg-muted text-muted-foreground"
            )}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </CardHeader>
      <CardContent>
        {hasAny ? (
          <ChartContainer config={config} className="h-[220px] w-full">
            <LineChart data={chartData} margin={{ top: 12, left: 4, right: 12 }}>
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
